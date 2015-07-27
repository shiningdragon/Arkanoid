// ball dynamics
// host

/*

Based in part on  http://www.dwmkerr.com/experiments/

*/

//*****************************************************************
//***************************Game**********************************
//*****************************************************************
function Game() {
    
    // Set the initial config.
    this.config = {
        gameWidth: 350,
        gameHeight: 400,
        fps: 50,
        debugMode: false,
        paddleSpeed: 250,
        ballSpeed: 200,
        blockDepth: 4,
        blockWidth: 25,
        blockHeight: 17,
        levelDifficultyMultiplier: 0.2
    };
    
    this.level = 1;
    this.lives = 3;
    
    this.width = 0;
    this.height = 0;
    this.gameBounds = { left: 0, top: 0, right: 0, bottom: 0 };
    
    //  The state stack.
    this.stateStack = [];
    
    //  Input/output
    this.pressedKeys = {};
    this.gameCanvas = null;
    
    //  All sounds.
    this.sounds = null;
}

// Initialise the game
Game.prototype.initialise = function (gameCanvas) {
    
    this.gameCanvas = gameCanvas;
    
    this.width = gameCanvas.width;
    this.height = gameCanvas.height;
    
    this.gameBounds = {
        left: gameCanvas.width / 2 - this.config.gameWidth / 2,
        right: gameCanvas.width / 2 + this.config.gameWidth / 2,
        top: gameCanvas.height / 2 - this.config.gameHeight / 2,
        bottom: gameCanvas.height / 2 + this.config.gameHeight / 2,
    };
};

// Get the current state of the game
Game.prototype.currentState = function () {
    return this.stateStack.length > 0 ? this.stateStack[this.stateStack.length - 1] : null;
};

// Remove the current state and add the given state
Game.prototype.moveToState = function (state) {
    
    if (this.currentState()) {
        if (this.currentState().leave) {
            this.currentState().leave(game);
        }
        
        this.stateStack.pop();
    }
    
    if (state.enter) {
        state.enter(game);
    }
    
    this.stateStack.push(state);
};

Game.prototype.pushState = function (state) {
    
    //  If there's an enter function for the new state, call it.
    if (state.enter) {
        state.enter(game);
    }
    //  Set the current state.
    this.stateStack.push(state);
};

Game.prototype.popState = function () {
    
    //  Leave and pop the state.
    if (this.currentState()) {
        if (this.currentState().leave) {
            this.currentState().leave(game);
        }
        
        //  Set the current state.
        this.stateStack.pop();
    }
};

//  Inform the game a key is down.
Game.prototype.keyDown = function (keyCode) {
    this.pressedKeys[keyCode] = true;
    //  Delegate to the current state too.
    if (this.currentState() && this.currentState().keyDown) {
        this.currentState().keyDown(this, keyCode);
    }
};

//  Inform the game a key is up.
Game.prototype.keyUp = function (keyCode) {
    delete this.pressedKeys[keyCode];
    //  Delegate to the current state too.
    if (this.currentState() && this.currentState().keyUp) {
        this.currentState().keyUp(this, keyCode);
    }
};

//  Mutes or unmutes the game.
Game.prototype.mute = function (mute) {
    
    //  If we've been told to mute, mute.
    if (mute === true) {
        this.sounds.mute = true;
    } else if (mute === false) {
        this.sounds.mute = false;
    } else {
        this.sounds.mute = this.sounds.mute ? false : true;
    }
};


// Return a random number in between x and y
function Random(x, y) {
    
    return x + (Math.random() * (y - x));
}

// The main loop
function gameLoop(game) {
    var currentState = game.currentState();
    if (currentState) {
        
        var dt = 1 / game.config.fps;
        
        var ctx = game.gameCanvas.getContext("2d");
        
        if (currentState.update) {
            currentState.update(game, dt);
        }
        if (currentState.draw) {
            currentState.draw(game, dt, ctx);
        }
    }
}

Game.prototype.start = function () {
    this.moveToState(new WelcomeState());
    var game = this;
    
    this.intervalId = setInterval(function () { gameLoop(game); }, 1000 / this.config.fps);
}

//****************************************************************
//**********************Welcome State*****************************
//****************************************************************

function WelcomeState() {

}

WelcomeState.prototype.enter = function () {
    
    // Create and load the sounds.
    game.sounds = new Sounds();
    game.sounds.init();
    game.sounds.loadSound('pong', 'sounds/pong.wav');
    game.sounds.loadSound('looselife', 'sounds/looselife.wav');
    game.sounds.loadSound('gameover', 'sounds/gameover.wav');
    game.sounds.loadSound('beep', 'sounds/beep.wav');
}

WelcomeState.prototype.draw = function (game, dt, ctx) {
    
    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);
    
    ctx.font = "30px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = "center";
    ctx.textAlign = "center";
    ctx.fillText("Arkanoid", game.width / 2, game.height / 2 - 40);
    ctx.font = "16px Arial";
    
    ctx.fillText("Press 'Space' to start.", game.width / 2, game.height / 2);
};

WelcomeState.prototype.keyDown = function (game, keyCode) {
    if (keyCode == 32) /*space*/ {
        //  Space starts the game.
        game.moveToState(new LevelIntroState(game.level));
    }
};

//****************************************************************
//**********************Level Intro State*************************
//****************************************************************

function LevelIntroState(level) {
    this.level = level;
    this.countdownMessage = "3";
}

LevelIntroState.prototype.draw = function (game, dt, ctx) {
    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);
    
    ctx.font = "36px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText("Level " + this.level, game.width / 2, game.height / 2);
    ctx.font = "24px Arial";
    ctx.fillText("Ready in " + this.countdownMessage, game.width / 2, game.height / 2 + 36);
};

LevelIntroState.prototype.update = function (game, dt) {
    
    //  Update the countdown.
    if (this.countdown === undefined) {
        this.countdown = 3; // countdown from 3 secs
    }
    this.countdown -= dt;
    
    if (this.countdown < 2) {
        this.countdownMessage = "2";
    }
    if (this.countdown < 1) {
        this.countdownMessage = "1";
    }
    if (this.countdown <= 0) {
        //  Move to the next level, popping this state.
        game.moveToState(new PlayState(game.config, this.level));
    }
 
};

//****************************************************************
//*********************************Play State*********************
//****************************************************************

function PlayState(config, level) {
    this.config = config;
    this.level = level;
    
    //  Game entities.
    this.paddle = null;
    this.ball = null;
    this.blocks = [];
}

// Game entities
function Paddle(x, y) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 16;
    this.last_x;
}

function Ball(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 8;
    //  theta is the angle the ball direction makes with the x axis. from -PI to PI, -PI/2 is vertically up, PI/2 is verticall down
    this.theta = (-1 / 2) * Math.PI;
    this.last_x;
    this.last_y;
}


function Block(x, y, width, height, depth, column, colour) {
    this.x = x;
    this.y = y;
    this.depth = depth; // rank from top to bottom up to a maximum of blockDepth, zero indexed
    this.column = column; // column block is in from left to right, zero indexed
    this.width = width;
    this.height = height;
    this.colour = colour;
}

PlayState.prototype.enter = function (game) {
    
    //  Set the ship speed for this level, as well as invader params.
    var levelMultiplier = this.level * this.config.levelDifficultyMultiplier;
    this.paddleSpeed = (1 + levelMultiplier) * this.config.paddleSpeed;
    this.ballSpeed = (1 + levelMultiplier) * this.config.ballSpeed;

    // Create the paddle
    this.paddle = new Paddle(game.width / 2, game.gameBounds.bottom);
    this.paddle.y -= (this.paddle.height / 2);
    
    // Create the ball
    this.ball = new Ball(this.paddle.x, this.paddle.y - (this.paddle.height / 2));
    this.ball.y -= this.ball.radius / 2;
    
    // Set a random start direction for the ball
    this.ball.theta = this.getThetaStartAngle();

    //  Create the blocks
    var blockColours = ["#FF0000", "#0000FF", "#FFFF00", "#008000"];
    var blocks = [];
    var blockWidth = this.config.blockWidth;
    var blockHeight = this.config.blockHeight;
    var blockSeperator = 1;
    var topGap = blockHeight * 3; 
    var numColumns = (game.gameBounds.right - game.gameBounds.left) / (blockWidth + blockSeperator);
    numColumns = Math.floor(numColumns);
    blockSeperator = ((game.gameBounds.right - game.gameBounds.left) - (numColumns * blockWidth)) / (numColumns - 1);
    for (var i = 0; i < this.config.blockDepth; ++i) {
        for (var j = 0; j < numColumns; ++j) {
            blocks.push(new Block(
                game.gameBounds.left + (blockWidth / 2) + j*(blockWidth + blockSeperator),
                topGap + game.gameBounds.top + (blockHeight / 2) + i * (blockHeight + blockSeperator),
                blockWidth, blockHeight,
                i, j, blockColours[i % 4]));
        }     
    }
    this.blocks = blocks;
}

PlayState.prototype.update = function (game, dt) {
    
    this.paddle.last_x = this.paddle.x;

    // Move the paddle
    if (game.pressedKeys[37]) {
        this.paddle.x -= dt * this.paddleSpeed;
    }
    if (game.pressedKeys[39]) {
        this.paddle.x += dt * this.paddleSpeed;
    }
    
    //  Keep the paddle in bounds
    if (this.paddle.x < game.gameBounds.left + (this.paddle.width / 2)) {
        this.paddle.x = game.gameBounds.left + (this.paddle.width / 2);
    }
    if (this.paddle.x > game.gameBounds.right - (this.paddle.width / 2)) {
        this.paddle.x = game.gameBounds.right - (this.paddle.width / 2);
    }
    
    // Move the ball
    this.ball.last_x = this.ball.x;
    this.ball.last_y = this.ball.y;
    this.ball.x += dt * this.ballSpeed * Math.cos(this.ball.theta);
    this.ball.y += dt * this.ballSpeed * Math.sin(this.ball.theta);
    
    
    // Check for collisions with the bounds and paddle
    if (this.ball.x <= game.gameBounds.left) {
        game.sounds.playSound('pong');
        this.reflectBallFromLeft();
    }
    
    if (this.ball.x >= game.gameBounds.right) {
        game.sounds.playSound('pong');
        this.reflectBallFromRight(); 
    }
    
    if (this.ball.y <= game.gameBounds.top) {
        game.sounds.playSound('pong');
        this.reflectBallFromTop(); 
    }
    
    // Check for collisions with the bottom    
    if (this.ball.y >= game.gameBounds.bottom) {
        this.looseLife();
    }

    // Check for collisions with the paddle
    if (this.ball.y >= this.paddle.y - this.paddle.height / 2 && 
        this.ball.x >= this.paddle.x - this.paddle.width / 2 && 
        this.ball.x <= this.paddle.x + this.paddle.width / 2) {
        game.sounds.playSound('pong');      
        this.reflectBallFromPaddle();
    }

    // Check for collisions with the blocks, we look for intersections of block sides and ball path
    for (var i = 0; i < this.blocks.length; ++i) {
        var block = this.blocks[i];
        
        var hit = false;
        // Block top
        var blockX1 = block.x - block.width / 2;
        var blockY1 = block.y - block.height / 2;
        var blockX2 = block.x + block.width / 2;
        var blockY2 = block.y - block.height / 2;
        if (this.lineIntersect(blockX1, blockY1, blockX2, blockY2, this.ball.last_x, this.ball.last_y, this.ball.x, this.ball.y)) {            
            hit = true;
            this.reflectBallFromTop();
        }

        // Block right
        if (!hit) {
            var blockX1 = block.x + block.width / 2;
            var blockY1 = block.y - block.height / 2;
            var blockX2 = block.x + block.width / 2;
            var blockY2 = block.y + block.height / 2;
            if (this.lineIntersect(blockX1, blockY1, blockX2, blockY2, this.ball.last_x, this.ball.last_y, this.ball.x, this.ball.y)) {
                hit = true;
                this.reflectBallFromRight();
            }
        }

        // Block bottom
        if (!hit) {
            var blockX1 = block.x - block.width / 2;
            var blockY1 = block.y + block.height / 2;
            var blockX2 = block.x + block.width / 2;
            var blockY2 = block.y + block.height / 2;
            if (this.lineIntersect(blockX1, blockY1, blockX2, blockY2, this.ball.last_x, this.ball.last_y, this.ball.x, this.ball.y)) {
                hit = true;
                this.reflectBallFromBottom();
            }
        }

        // Block left
        if (!hit) {
            var blockX1 = block.x - block.width / 2;
            var blockY1 = block.y - block.height / 2;
            var blockX2 = block.x - block.width / 2;
            var blockY2 = block.y + block.height / 2;
            if (this.lineIntersect(blockX1, blockY1, blockX2, blockY2, this.ball.last_x, this.ball.last_y, this.ball.x, this.ball.y)) {
                hit = true;
                this.reflectBallFromLeft();
            }
        }

        if (hit) {
            this.blocks.splice(i, 1);
            game.sounds.playSound('beep');
            break;
        }
    } 

    // Check if we can move to the next level
    if (this.blocks.length == 0) {
        game.level = game.level + 1;
        game.moveToState(new LevelIntroState(game.level));
    }
}

PlayState.prototype.reflectBallFromPaddle = function () {
    // Some better ball dynamics
    var currentPaddleSpeedSpeed = this.paddle.last_x - this.paddle.x;
    if (currentPaddleSpeedSpeed > 0) {
        var adjuster = 1 * (25 / 180) * Math.PI;
        var newTheta = theta - adjuster;
        if (newTheta > -1 * Math.PI) {
                //this.ball.theta = newTheta
        }
        this.ball.theta = -1* this.ball.theta;

    }
    else if (currentPaddleSpeedSpeed < 0) {
        var adjuster = 1 * (25 / 180) * Math.PI;
        var newTheta = theta + adjuster;
        if (newTheta < 0) {
                //this.ball.theta = newTheta
        }
        this.ball.theta = -1 * this.ball.theta;
    }
    else {
        this.ball.theta = -1 * this.ball.theta;
    }
}

PlayState.prototype.reflectBallFromTop = function () {
    this.ball.theta = -1 * this.ball.theta;
}

PlayState.prototype.reflectBallFromBottom = function () {
    this.ball.theta = -1 * this.ball.theta;
}

PlayState.prototype.reflectBallFromLeft = function () {
    this.ball.theta = -1 * Math.PI - this.ball.theta;
}

PlayState.prototype.reflectBallFromRight = function () {
    this.ball.theta = Math.PI - this.ball.theta;
}

PlayState.prototype.lineIntersect = function(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y)
{
    var s1_x, s1_y, s2_x, s2_y;
    s1_x = p1_x - p0_x; s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x; s2_y = p3_y - p2_y;
    
    var s, t;
    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);
    
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        // Collision detected
        return true;
    }
    
    return false; // No collision
}

PlayState.prototype.draw = function (game, dt, ctx) {
    
    ctx.clearRect(0, 0, game.width, game.height);
    
    // Draw boundary
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(game.gameBounds.left, game.gameBounds.top, game.gameBounds.right - game.gameBounds.left, game.gameBounds.bottom - game.gameBounds.top);
    
    // Draw paddle
    ctx.fillStyle = '#999999';
    ctx.fillRect(
        this.paddle.x - (this.paddle.width / 2), 
        this.paddle.y - (this.paddle.height / 2), 
        this.paddle.width, 
        this.paddle.height);
    
    // Draw Ball
    ctx.fillStyle = '#ff5555';
    ctx.fillRect(
        this.ball.x - (this.ball.radius / 2), 
        this.ball.y - (this.ball.radius / 2), 
        this.ball.radius, 
        this.ball.radius);
    
    //  Draw Blocks    
    for (var i = 0; i < this.blocks.length; i++) {
        var block = this.blocks[i];
        ctx.fillStyle = block.colour;
        ctx.fillRect(block.x - block.width / 2, block.y - block.height / 2, block.width, block.height);
    }

    // Draw lives
    ctx.fillStyle = '#999999';
    var lifeHeight = 8;
    var lifeWidth = 18;
    for (i = 0; i < game.lives ; i++) {
        ctx.fillRect(
            game.gameBounds.right - (i+1) * lifeWidth - i * 5, 
            game.gameBounds.bottom + lifeHeight + 1, 
            lifeWidth, 
            lifeHeight);
    }
}

PlayState.prototype.looseLife = function () {      

    game.lives = game.lives - 1;
    if (game.lives == 0) {
        game.moveToState(new GameOverState());
    } else {
        game.sounds.playSound('looselife');
        this.ball.x = this.paddle.x;
        this.ball.y = this.paddle.y - (this.paddle.height / 2) - (this.ball.radius / 2);
        this.ball.theta = this.getThetaStartAngle();
    }
}

// Return a suitable start angle
PlayState.prototype.getThetaStartAngle = function() {
    return Random((-1 / 6) * Math.PI, (-5 / 6) * Math.PI);  //from -150 to -30 degrees
}

//*****************************************************************
//**********************GameOver State*****************************
//*****************************************************************

function GameOverState() {

}

GameOverState.prototype.enter = function () {
    game.sounds.playSound('gameover');
}

GameOverState.prototype.draw = function (game, dt, ctx) {
    
    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);
    
    ctx.font = "30px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = "center";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", game.width / 2, game.height / 2 - 40);
    ctx.font = "16px Arial";
    
    ctx.fillText("Press 'Space' to play again.", game.width / 2, game.height / 2);
};

GameOverState.prototype.keyDown = function (game, keyCode) {
    if (keyCode == 32) /*space*/ {
        //  Space starts the game.
        game.level = 1;
        game.lives = 3;
        game.moveToState(new LevelIntroState(game.level));
    }
};

//****************************************************************
//******************************Sounds ***************************
//****************************************************************

/*

    Sounds

    The sounds class is used to asynchronously load sounds and allow
    them to be played.

*/
function Sounds() {
    
    //  The audio context.
    this.audioContext = null;
    
    //  The actual set of loaded sounds.
    this.sounds = {};
}

Sounds.prototype.init = function () {
    
    //  Create the audio context, paying attention to webkit browsers.
    context = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new context();
    this.mute = false;
};

Sounds.prototype.loadSound = function (name, url) {
    
    //  Reference to ourselves for closures.
    var self = this;
    
    //  Create an entry in the sounds object.
    this.sounds[name] = null;
    
    //  Create an asynchronous request for the sound.
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'arraybuffer';
    req.onload = function () {
        self.audioContext.decodeAudioData(req.response, function (buffer) {
            self.sounds[name] = { buffer: buffer };
        });
    };
    try {
        req.send();
    } catch (e) {
        console.log("An exception occured getting sound the sound " + name + " this might be " +
         "because the page is running from the file system, not a webserver, use the node web server to run the site.");
        console.log(e);
    }
};

Sounds.prototype.playSound = function (name) {
    
    //  If we've not got the sound, don't bother playing it.
    if (this.sounds[name] === undefined || this.sounds[name] === null || this.mute === true) {
        return;
    }
    
    //  Create a sound source, set the buffer, connect to the speakers and
    //  play the sound.
    var source = this.audioContext.createBufferSource();
    source.buffer = this.sounds[name].buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
};