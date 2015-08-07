// include gulp
var gulp = require('gulp');

// include plugins
var git = require('gulp-git');
var argv = require('yargs').argv;

var gitUrl = argv.gitUrl
console.log('deploying to giturl ' + gitUrl);


gulp.task('setupremote', function () {
    git.addRemote('azure', gitUrl, function (err) {
        //if (err) throw err;
    });
});


// push and use force to always just overwrite the remote repo
gulp.task('pushrepo', ['setupremote'], function () {
    git.push('azure', 'master', { args: " -f" }, function (err) {
        if (err) throw err;
    });
});


// default gulp task
gulp.task('default', ['pushrepo'], function () {
});