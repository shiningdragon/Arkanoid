// include gulp
var gulp = require('gulp');

// include plugins
var git = require('gulp-git');
var jshint = require('gulp-jshint');
var argv = require('yargs').argv;


var gitUrl = argv.gitUrl
console.log('deploying to giturl ' + gitUrl);

// JS hint task
gulp.task('jshint', function () {
    gulp.src('./public/js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// push and use force to always just overwrite the remote repo
gulp.task('deploy', function () {
    git.push(gitUrl, 'master', { args: " -f" }, function (err) {
        if (err) throw err;
    });
});


// default gulp task
gulp.task('default', ['jshint', 'deploy'], function () {
});