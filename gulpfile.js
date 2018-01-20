const gulp = require('gulp');
const ts = require('gulp-typescript')
const uglify = require('gulp-uglify')

gulp.task('ts', (done) => {
    var tsProject = ts.createProject('tsconfig.json');
    gulp.src('src/*.ts')
        .pipe(tsProject())
        .pipe(uglify())
        .pipe(gulp.dest('extension'));
})

gulp.task('default', function defaultTask(done) {
  // place code for your default task here
  done();
})