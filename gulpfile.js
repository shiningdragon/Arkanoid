// include gulp
var gulp = require('gulp');

// include plugins
var git = require('gulp-git');
var argv = require('yargs').argv;
var runSequence = require('run-sequence');

var gitUrl = argv.gitUrl
console.log('deploying to giturl ' + gitUrl);


// push and use force to always just overwrite the remote repo
gulp.task('pushrepo', function () {
    git.push(gitUrl, 'master', { args: " -f" }, function (err) {
        if (err) throw err;
    });
});


// default gulp task
gulp.task('default', ['pushrepo'], function () {
});