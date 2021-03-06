/**
 * Tasks:
 *
 * gulp dist
 *   Generates the browser app in development mode (unless NODE_ENV is set
 *   to 'production').
 *
 * gulp live
 *   Generates the browser app in development mode (unless NODE_ENV is set
 *   to 'production'), opens it and watches for changes in the source code.
 *
 * gulp
 *   Alias for `gulp live`.
 */

const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const gutil = require('gulp-util');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const change = require('gulp-change');
const header = require('gulp-header');
const touch = require('gulp-touch-cmd');
const browserify = require('browserify');
const watchify = require('watchify');
const envify = require('envify/custom');
const uglify = require('gulp-uglify-es').default;
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const del = require('del');
const mkdirp = require('mkdirp');
const ncp = require('ncp');
const eslint = require('gulp-eslint');
const stylus = require('gulp-stylus');
const cssBase64 = require('gulp-css-base64');
const nib = require('nib');
const browserSync = require('browser-sync');

const PKG = require('./package.json');
const BANNER = fs.readFileSync('banner.txt').toString();
const BANNER_OPTIONS =
{
	pkg         : PKG,
	currentYear : (new Date()).getFullYear()
};
const OUTPUT_DIR = '../server/public';
const appOptions = require('./config/config');
const SERVER_CONFIG = '../server/config/config';

// Set Node 'development' environment (unless externally set).
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

gutil.log(`NODE_ENV: ${process.env.NODE_ENV}`);

function logError(error)
{
	gutil.log(gutil.colors.red(error.stack));
}

function bundle(options)
{
	options = options || {};

	const watch = Boolean(options.watch);

	let bundler = browserify(
		{
			entries      : PKG.main,
			extensions   : [ '.js', '.jsx' ],
			// required for sourcemaps (must be false otherwise).
			debug        : process.env.NODE_ENV === 'development',
			// required for watchify.
			cache        : {},
			// required for watchify.
			packageCache : {},
			// required to be true only for watchify.
			fullPaths    : watch
		})
		.transform('babelify')
		.transform(envify(
			{
				NODE_ENV : process.env.NODE_ENV,
				_        : 'purge'
			}));

	if (watch)
	{
		bundler = watchify(bundler);

		bundler.on('update', () =>
		{
			const start = Date.now();

			gutil.log('bundling...');
			rebundle();
			gutil.log('bundle took %sms', (Date.now() - start));
		});
	}

	function rebundle()
	{
		return bundler.bundle()
			.on('error', logError)
			.pipe(plumber())
			.pipe(source(`${PKG.name}.js`))
			.pipe(buffer())
			.pipe(rename(`${PKG.name}.js`))
			.pipe(gulpif(process.env.NODE_ENV === 'production',
				uglify()
			))
			.pipe(header(BANNER, BANNER_OPTIONS))
			.pipe(gulp.dest(OUTPUT_DIR));
	}

	return rebundle();
}

function changeHTML(content)
{
	return content.replace(/chromeExtension/g, appOptions.chromeExtension);
}

gulp.task('clean', () => del(OUTPUT_DIR, { force: true }));

const LINTING_FILES = [
	'gulpfile.js',
	'lib/**/*.js',
	'lib/**/*.jsx'
];

gulp.task('lint', () =>
{
	return gulp.src(LINTING_FILES)
		.pipe(plumber())
		.pipe(eslint())
		.pipe(eslint.format());
});

gulp.task('lint-fix', function()
{
	return gulp.src(LINTING_FILES)
		.pipe(plumber())
		.pipe(eslint({ fix: true }))
		.pipe(eslint.format())
		.pipe(gulp.dest((file) => file.base));
});

gulp.task('css', () =>
{
	return gulp.src('stylus/index.styl')
		.pipe(plumber())
		.pipe(stylus(
			{
				use      : nib(),
				compress : process.env.NODE_ENV === 'production'
			}))
		.on('error', logError)
		.pipe(cssBase64(
			{
				baseDir           : '.',
				maxWeightResource : 50000 // So big ttf fonts are not included, nice.
			}))
		.pipe(rename(`${PKG.name}.css`))
		.pipe(gulp.dest(OUTPUT_DIR))
		.pipe(touch());
});

gulp.task('html', () =>
{
	return gulp.src('*.html')
		.pipe(change(changeHTML))
		.pipe(gulp.dest(OUTPUT_DIR));
});

gulp.task('resources', (done) =>
{
	const dst = path.join(OUTPUT_DIR, 'resources');

	mkdirp.sync(dst);
	ncp('resources', dst, { stopOnErr: true }, (error) =>
	{
		if (error && error[0].code !== 'ENOENT')
			throw new Error(`resources copy failed: ${error}`);

		done();
	});
});

gulp.task('bundle', () =>
{
	return bundle({ watch: false });
});

gulp.task('bundle:watch', () =>
{
	return bundle({ watch: true });
});

gulp.task('livebrowser', (done) =>
{
	const config = require(SERVER_CONFIG);

	browserSync(
		{
			open   : 'external',
			host   : config.domain,
			port   : 3000,
			server :
			{
				baseDir : OUTPUT_DIR
			},
			https     : config.tls,
			ghostMode : false,
			files     : path.join(OUTPUT_DIR, '**', '*')
		});

	done();
});

gulp.task('browser', (done) =>
{
	const config = require(SERVER_CONFIG);

	browserSync(
		{
			open   : 'external',
			host   : config.domain,
			port   : 3000,
			server :
			{
				baseDir : OUTPUT_DIR
			},
			https     : config.tls,
			ghostMode : false
		});

	done();
});

gulp.task('watch', (done) =>
{
	// Watch changes in HTML.
	gulp.watch([ '*.html' ], gulp.series(
		'html'
	));

	// Watch changes in Stylus files.
	gulp.watch([ 'stylus/**/*.styl' ], gulp.series(
		'css'
	));

	// Watch changes in resources.
	gulp.watch([ 'resources/**/*' ], gulp.series(
		'resources', 'css'
	));

	// Watch changes in JS files.
	gulp.watch([ 'gulpfile.js', 'lib/**/*.js', 'lib/**/*.jsx' ], gulp.series(
		'lint'
	));

	done();
});

gulp.task('dist', gulp.series(
	'clean',
	'lint',
	'bundle',
	'html',
	'css',
	'resources'
));

gulp.task('dist-watch', gulp.series(
	'clean',
	'lint',
	'bundle:watch',
	'html',
	'css',
	'resources',
	'watch',
));

gulp.task('live', gulp.series(
	'clean',
	'lint',
	'bundle:watch',
	'html',
	'css',
	'resources',
	'watch',
	'livebrowser'
));

gulp.task('open', gulp.series('browser'));

gulp.task('default', gulp.series('live'));
