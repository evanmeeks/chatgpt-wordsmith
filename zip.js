import gulp from 'gulp';
import zip from 'gulp-zip';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const manifest = require('./build/manifest.json');
console.log('manifest.version', manifest.version);

gulp
  .src('build/**')
  .pipe(zip(`${manifest.name.replaceAll(' ', '-')}-${manifest.version}.zip`))
  .pipe(gulp.dest('package'));
