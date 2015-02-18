
gulp = require 'gulp'
$ = (require 'gulp-load-plugins')()

gulp.task 'lint', ->
  gulp.src './src/**/*.coffee'
    .pipe $.coffeelint()
    .pipe $.coffeelint.reporter()


gulp.task 'build', ->
  gulp.src './src/**/*.coffee'
    .pipe ($.coffee bare: true).on 'error', $.util.log
    .pipe gulp.dest './dist'


gulp.task 'default', ['lint', 'build'], ->
