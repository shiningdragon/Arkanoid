﻿// git
// sounds
// lives
// ball dynamics
// node
// invaders
// host

//*****************************************************************
//***************************Game**********************************
//*****************************************************************

function Game() {
    
    // Set the initial config.
    this.config = {
        gameWidth: 600,
        gameHeight: 400,
        fps: 50,
        debugMode: false,
        paddleSpeed: 200,
        ballSpeed: 200,
        levelDifficultyMultiplier: 0.2,
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
    game.sounds.loadSound('bang', 'sounds/bang.wav');
    game.sounds.loadSound('explosion', 'sounds/explosion.wav');
}

WelcomeState.prototype.draw = function (game, dt, ctx) {
    
    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);
    
    ctx.font = "30px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = "center";
    ctx.textAlign = "center";
    ctx.fillText("Pong vs Space Invaders", game.width / 2, game.height / 2 - 40);
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
}

// Game entities
function Paddle(x, y) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 16;
}

function Ball(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 8;
    //  theta is the angle the ball direction makes with the x axis. from 0 to 2PI, (3/2)PI is vertically up, PI/2 is verticall down
    this.theta = (3/2) * Math.PI; 
}

PlayState.prototype.enter = function (game) {
    
    this.paddle = new Paddle(game.width / 2, game.gameBounds.bottom);
    this.paddle.y -= (this.paddle.height / 2);
    
    this.ball = new Ball(this.paddle.x, this.paddle.y - (this.paddle.height / 2));
    this.ball.y -= this.ball.radius / 2;
    
    // Set a random start direction for the ball
    this.ball.theta = Random((7/12) * 2 * Math.PI, (11/12) * 2 * Math.PI);  //from 210 to 330 degrees
    
    //  Set the ship speed for this level, as well as invader params.
    var levelMultiplier = this.level * this.config.levelDifficultyMultiplier;
    this.paddleSpeed = (1 + levelMultiplier) * this.config.paddleSpeed;
    this.ballSpeed = (1 + levelMultiplier) * this.config.ballSpeed;
}

PlayState.prototype.update = function (game, dt) {
    
    // Move the paddle
    if (game.pressedKeys[37]) {
        this.paddle.x -= dt * this.paddleSpeed;
    }
    if (game.pressedKeys[39]) {
        this.paddle.x += dt * this.paddleSpeed;
    }
    
    //  Keep the paddle in bounds.
    if (this.paddle.x < game.gameBounds.left + (this.paddle.width / 2)) {
        this.paddle.x = game.gameBounds.left + (this.paddle.width / 2);
    }
    if (this.paddle.x > game.gameBounds.right - (this.paddle.width / 2)) {
        this.paddle.x = game.gameBounds.right - (this.paddle.width / 2);
    }
    
    // Move the ball
    this.ball.x += dt * this.ballSpeed * Math.cos(this.ball.theta);
    this.ball.y += dt * this.ballSpeed * Math.sin(this.ball.theta);
    
    
    // Check for collisions with the bounds and paddle
    if (this.ball.x <= game.gameBounds.left) {
        game.sounds.playSound('bang');
        //if(this.ball.theta )
        this.ball.theta = (this.ball.theta + Math.PI / 2) % (2 * Math.PI);
    }
    
    if (this.ball.x >= game.gameBounds.right) {
        game.sounds.playSound('bang');
        this.ball.theta = (this.ball.theta - Math.PI / 2) % (2 * Math.PI);
    }
    
    if (this.ball.y <= game.gameBounds.top) {
        game.sounds.playSound('bang');
        this.ball.theta = (this.ball.theta + Math.PI / 2) % (2 * Math.PI);
    }
    
    // Check for collisions with the paddle
    if (this.ball.y >= this.paddle.y - this.paddle.height / 2 && 
        this.ball.x >= this.paddle.x - this.paddle.width / 2 && 
        this.ball.x <= this.paddle.x + this.paddle.width / 2) {
        game.sounds.playSound('bang');
        this.ball.theta -= Math.PI;
    }
    
    // Check for collisions with the bottom    
    if (this.ball.y >= game.gameBounds.bottom) {
        this.looseLife();
    }
}

PlayState.prototype.draw = function (game, dt, ctx) {
    
    ctx.clearRect(0, 0, game.width, game.height);
    //ctx.fillStyle = '#000000';
    //ctx.fillRect(game.gameBounds.left, game.gameBounds.top, game.gameBounds.right - game.gameBounds.left, game.gameBounds.bottom - game.gameBounds.top);
    
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
}

PlayState.prototype.looseLife = function () {
    
    game.lives = game.lives - 1;
    if (game.lives == 0) {
        game.moveToState(new GameOverState());
    } else {
        this.ball.x = this.paddle.x;
        this.ball.y = this.paddle.y - (this.paddle.height / 2) - (this.ball.radius / 2);
        this.ball.theta = Random(-150, 30);
    }
}

//*****************************************************************
//**********************GameOver State*****************************
//*****************************************************************

function GameOverState() {

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
         "because the page is running from the file system, not a webserver.");
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