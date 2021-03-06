/* eslint-disable */
/* global describe, it */
'use strict';
var fs = require('fs');
var path = require('path');
var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;
var gulp = require('gulp');
var gutil = require('gulp-util');
var through = require('through2');
var mockery = require('mockery');
var _ = require('lodash');

chai.use(require('chai-things'));

chai.config.includeStack = false;

var testData = [
	{
		it: 'should work with a CSS file 2 levels deep, URL 2 levels up',
		args: [ 'css\\page\\home.css', '../../images/foo.png?a=123', { base: 'assets' } ],
		res: {
			newUrl: 'url("../../assets/images/foo.png?a=123")',
			assetPath: '..\\..\\images\\foo.png',
			newAssetFile: 'assets\\images\\foo.png'
		}
	},

	{
		it: 'should work with a CSS file 2 levels deep, URL 1 level up',
		args: [ 'test\\fixtures\\01.css', '../fonts/font1.woff?a=123', { base: 'fonts' } ],
		res: {
			newUrl: 'url("../../fonts/fonts/font1.woff?a=123")',
			assetPath: '..\\fonts\\font1.woff',
			newAssetFile: 'fonts\\fonts\\font1.woff'
		}
	},

	{
		it: 'should work with a CSS file 1 level deep, URL 1 level up',
		args: [ 'fixtures\\01.css', '../fonts/font1.woff?a=123', { base: 'fonts' } ],
		res: {
			newUrl: 'url("../fonts/fonts/font1.woff?a=123")',
			assetPath: '..\\fonts\\font1.woff',
			newAssetFile: 'fonts\\fonts\\font1.woff'
		}
	},

	{
		it: 'should work with a CSS file 1 level deep, URL 0 levels up',
		args: [ 'fixtures\\01.css', 'fonts/font1.woff?a=123', { base: 'fonts' } ],
		res: {
			newUrl: 'url("../fonts/fonts/font1.woff?a=123")',
			assetPath: 'fonts\\font1.woff',
			newAssetFile: 'fonts\\fonts\\font1.woff'
		}
	},

	{
		it: 'should work with a CSS file 0 levels deep, URL 0 levels up',
		args: [ '01.css', 'fonts/font1.woff?a=123', { base: 'fonts' } ],
		res: {
			newUrl: 'url("fonts/fonts/font1.woff?a=123")',
			assetPath: 'fonts\\font1.woff',
			newAssetFile: 'fonts\\fonts\\font1.woff'
		}
	},

	{
		it: 'should work with a URL 0 levels up and a multilevel base',
		args: [ 'fixtures\\01.css', 'fonts/font1.woff?a=123', { base: 'fonts\\foo' } ],
		res: {
			newUrl: 'url("../fonts/foo/fonts/font1.woff?a=123")',
			assetPath: 'fonts\\font1.woff',
			newAssetFile: 'fonts\\foo\\fonts\\font1.woff'
		}
	},

	{
		it: 'should work with a URL 1 level up and a multilevel base',
		args: [ 'fixtures\\01.css', '../fonts/font1.woff?a=123', { base: 'fonts\\foo' } ],
		res: {
			newUrl: 'url("../fonts/foo/fonts/font1.woff?a=123")',
			assetPath: '..\\fonts\\font1.woff',
			newAssetFile: 'fonts\\foo\\fonts\\font1.woff'
		}
	},

	{
		it: 'should work with a blank base with a CSS file 1 level deep and a URL 0 levels up',
		args: [ 'fixtures\\01.css', 'fonts/font1.woff?a=123', { base: '' } ],
		res: {
			newUrl: 'url("../fonts/font1.woff?a=123")',
			assetPath: 'fonts\\font1.woff',
			newAssetFile: 'fonts\\font1.woff'
		}
	},

	{
		it: 'should work with a base with 1 dir and a CSS file 2 levels deep and a URL 2 levels up',
		args: ['src\\app\\index.css', '../../bower_components/font-awesome/fonts/fontawesome-webfont.eot?v=4.5.0', { base: 'x' } ],
		res: {
			newUrl: 'url("../../x/bower_components/font-awesome/fonts/fontawesome-webfont.eot?v=4.5.0")',
			assetPath: '..\\..\\bower_components\\font-awesome\\fonts\\fontawesome-webfont.eot',
			newAssetFile: 'x\\bower_components\\font-awesome\\fonts\\fontawesome-webfont.eot'
		}
	},

	{
		it: 'should work with a blank base with a CSS file 1 level deep and a URL 1 level up',
		args: ['app\\index.css', '../bower_components/font-awesome/fonts/fontawesome-webfont.eot?v=4.5.0', { base: '' } ],
		res: {
			newUrl: 'url("../bower_components/font-awesome/fonts/fontawesome-webfont.eot?v=4.5.0")',
			assetPath: '..\\bower_components\\font-awesome\\fonts\\fontawesome-webfont.eot',
			newAssetFile: 'bower_components\\font-awesome\\fonts\\fontawesome-webfont.eot'
		}
	},

	{
		it: 'should work with a blank base with a CSS file 2 levels deep and a URL 2 levels up',
		args: ['src\\app\\index.css', '../../bower_components/font-awesome/fonts/fontawesome-webfont.eot?v=4.5.0', { base: '' } ],
		res: {
			newUrl: 'url("../../bower_components/font-awesome/fonts/fontawesome-webfont.eot?v=4.5.0")',
			assetPath: '..\\..\\bower_components\\font-awesome\\fonts\\fontawesome-webfont.eot',
			newAssetFile: 'bower_components\\font-awesome\\fonts\\fontawesome-webfont.eot'
		}
	}
];


// These 2 tests fail on Windows with path.posix.relative because internally, it uses process.cwd, which yields
// something that it believes isn't an absolute path.  Run these 2 tests using native path.relative only.
var nativeOnlyTestData = [
	{
		it: 'should work with a blank base with a CSS file 1 level deep and a URL 2 levels up',
		args: ['app/index.css', '../../bower_components/font-awesome/fonts/fontawesome-webfont.eot?v=4.5.0', { base: '' } ],
		res: {
			newUrl: 'url("../../bower_components/font-awesome/fonts/fontawesome-webfont.eot?v=4.5.0")',
			assetPath: '..\\..\\bower_components\\font-awesome\\fonts\\fontawesome-webfont.eot',
			newAssetFile: '..\\bower_components\\font-awesome\\fonts\\fontawesome-webfont.eot'
		}
	},

	{
		it: 'should work with a base with 1 dir and a CSS file 1 level deep and a URL 2 levels up',
		args: ['app\\index.css', '../../bower_components/font-awesome/fonts/fontawesome-webfont.eot?v=4.5.0', { base: 'x' } ],
		res: {
			newUrl: 'url("../bower_components/font-awesome/fonts/fontawesome-webfont.eot?v=4.5.0")',
			assetPath: '..\\..\\bower_components\\font-awesome\\fonts\\fontawesome-webfont.eot',
			newAssetFile: 'bower_components\\font-awesome\\fonts\\fontawesome-webfont.eot'
		}
	}
];


function fixBackslashesInPath(filePath, sep) {
	return filePath.replace(/\\/g, sep);
}


function generateTestData(testCases, sep) {
	return testCases.map(function(testItem) {
		return {
			it: testItem.it,
			args: [ fixBackslashesInPath(testItem.args[0], sep), testItem.args[1], { base: fixBackslashesInPath(testItem.args[2].base, sep) } ],
			res: {
				newUrl: testItem.res.newUrl,
				assetPath: fixBackslashesInPath(testItem.res.assetPath, sep),
				newAssetFile: fixBackslashesInPath(testItem.res.newAssetFile, sep)
			}
		};
	});
}


describe('generateDirs()', function() {
	before(function() {
		mockery.enable();
	});

	after(function() {
		mockery.disable();
	});

	describe('with OS local paths', function() {
		var generateDirs;

		var localTestData = generateTestData(testData, path.sep).concat(generateTestData(nativeOnlyTestData, path.sep))

		before(function() {
			mockery.registerAllowables(['url', '../generateDirs'], true);
			mockery.registerMock('path', path);
			generateDirs = require('../generateDirs');
		});

		after(function() {
			mockery.deregisterAll();
		});

		localTestData.forEach(function(testItem) {
			it(testItem.it, function() {
				var dirs = generateDirs.apply(global, testItem.args);
				expect(dirs).to.eql(testItem.res);
			});
		});

		it('should work with a pathTransform function', function() {
			var incssFilePathReldirs = fixBackslashesInPath('css\\page\\home.css', path.sep);
			var inurlMatch = '../../images/foo.png?a=123';
			var inoptions = {
				base: 'assets',
				pathTransform: function(newAssetFile, cssFilePathRel, urlMatch, options) {
					expect(newAssetFile).to.equal(fixBackslashesInPath('assets\\images\\foo.png', path.sep));
					expect(cssFilePathRel).to.equal(incssFilePathReldirs);
					expect(urlMatch).to.equal(inurlMatch);
					expect(options).to.eql(inoptions);
					return "totally" + path.sep + "different" + path.sep + "file.png";
				}
			};

			var dirs = generateDirs(incssFilePathReldirs, inurlMatch, inoptions);
			expect(dirs).to.eql({
				newUrl: 'url("../../totally/different/file.png?a=123")',
				assetPath: '..' + path.sep + '..' + path.sep + 'images' + path.sep + 'foo.png',
				newAssetFile: 'totally' + path.sep + 'different' + path.sep + 'file.png'
			});
		});
	});

	describe('with posix paths', function() {
		var generateDirs;

		var localTestData = generateTestData(testData, path.posix.sep);

		before(function() {
			mockery.registerAllowables(['url', '../generateDirs'], true);

			var posixPath = _.extend({}, path.posix);
			posixPath.posix = path.posix;
			posixPath.win32 = path.win32;
			mockery.registerMock('path', posixPath);

			generateDirs = require('../generateDirs');
		});

		after(function() {
			mockery.deregisterAll();
		});

		localTestData.forEach(function(testItem) {
			it(testItem.it, function() {
				var dirs = generateDirs.apply(global, testItem.args);
				expect(dirs).to.eql(testItem.res);
			});
		});
	});


	describe('with win32 paths', function() {
		var generateDirs;

		var localTestData = generateTestData(testData, path.win32.sep);

		before(function() {
			mockery.registerAllowables(['url', '../generateDirs'], true);

			var win32Path = _.extend({}, path.win32);
			win32Path.posix = path.posix;
			win32Path.win32 = path.win32;
			mockery.registerMock('path', win32Path);

			generateDirs = require('../generateDirs');
		});

		after(function() {
			mockery.deregisterAll();
		});

		localTestData.forEach(function(testItem) {
			it(testItem.it, function() {
				var dirs = generateDirs.apply(global, testItem.args);
				expect(dirs).to.eql(testItem.res);
			});
		});
	});
});


describe('appropriate warnings', function() {
	var mockedGutil;
	before(function() {
		mockery.enable({
			warnOnUnregistered: false
		});
		mockery.registerAllowables(['../index'], true);

		mockedGutil = _.extend({}, gutil);
		mockedGutil.log = sinon.spy();
		mockery.registerMock('gulp-util', mockedGutil);
	});

	after(function() {
		mockery.deregisterAll();
		mockery.disable();
	});

	it('should log a warning when an asset isn\'t found', function(done) {
		var gulpUseCssUseRef = require('../index');

		gulp.src(path.join('test/fixtures/1/css/assetnotfound.css'))
			.pipe(gulpUseCssUseRef())
			.pipe(through.obj(function(file, enc, callback) {
				callback();
			}, function(cb) {
				expect(mockedGutil.log.called).to.be.true;
				done();
				cb();
			}));
	});
});

function getExpected(filePath) {
	return fs.readFileSync(filePath).toString();
}


describe('gulp-use-css filter', function() {
	var gulpUseCssUseRef;
	before(function() {
		gulpUseCssUseRef = require('../index');
	});

	function compare(name, expectedName, done) {
		gulp.src(name)
			.pipe(gulpUseCssUseRef({ base: 'fixtures' }))
			.pipe(through.obj(function(file, enc, callback) {
				if (path.basename(file.path) === path.basename(name))
					expect(getExpected(expectedName)).to.equal(file.contents.toString());
				callback();
			}, function(cb) {
				done();
				cb();
			}));
	}

	this.timeout(5000);

	it('file should pass a non-CSS file through unchanged', function(done) {
		compare('test/fixtures/1/jsfile.js', 'test/fixtures/1/jsfile.js', done);
	});

	it('should let null files pass through', function(done) {
		var stream = gulpUseCssUseRef();

		stream.pipe(through.obj(function(file, enc, callback) {
			expect(file.path).to.equal('null.css');
			expect(file.contents).to.equal(null);
			callback();
		}, function(callback) {
			done();
			callback();
		}));

		stream.write(new gutil.File({
			path: 'null.css',
			contents: null
		 }));

		stream.end();
	});

	it('should emit error on streamed file', function(done) {
		gulp.src(path.join('test/fixtures/1/css/dupasset.css'), { buffer: false })
			.pipe(gulpUseCssUseRef())
			.on('error', function (err) {
				expect(err.message).to.equal('Streaming not supported');
				done();
			});
	});

	it('should pass the contents of asset files through unchanged', function(done) {
		var files = [];

		gulp.src(path.normalize('test/fixtures/1/css/oneasset.css'), { base: 'test/fixtures/1' })
			.pipe(gulpUseCssUseRef())
			.pipe(through.obj(function(file, enc, callback) {
				files.push(file);
				callback();
			}, function(cb) {
				var cssFile = _.find(files, _.matches({relative: fixBackslashesInPath('fonts\\asset1.eot', path.sep)}));
				expect(cssFile).to.not.be.undefined;
				expect(getExpected('test/fixtures/1/fonts/asset1.eot')).to.equal(cssFile.contents.toString());
				done();
				cb();
			}));
	});

	describe('with an asset with ..\'s in it', function() {
		it('should handle not having an options object', function(done) {
			var files = [];

			gulp.src(path.normalize('test/fixtures/1/css/oneasset.css'), { base: 'test/fixtures/1' })
				.pipe(gulpUseCssUseRef())
				.pipe(through.obj(function(file, enc, callback) {
					files.push(file);
					callback();
				}, function(cb) {
					expect(files).to.have.lengthOf(2);
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('fonts\\asset1.eot', path.sep));
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('css\\oneasset.css', path.sep));
					var cssFile = _.find(files, _.matches({relative: fixBackslashesInPath('css\\oneasset.css', path.sep)}));
					expect(cssFile).to.not.be.undefined;
					expect(getExpected('test/expected/nooptions.css')).to.equal(cssFile.contents.toString());
					done();
					cb();
				}));
		});

		it('should handle having an options object with a null base', function(done) {
			var files = [];

			gulp.src(path.normalize('test/fixtures/1/css/oneasset.css'), { base: 'test/fixtures/1' })
				.pipe(gulpUseCssUseRef({ base: null }))
				.pipe(through.obj(function(file, enc, callback) {
					files.push(file);
					callback();
				}, function(cb) {
					expect(files).to.have.lengthOf(2);
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('fonts\\asset1.eot', path.sep));
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('css\\oneasset.css', path.sep));
					var cssFile = _.find(files, _.matches({relative: fixBackslashesInPath('css\\oneasset.css', path.sep)}));
					expect(cssFile).to.not.be.undefined;
					expect(getExpected('test/expected/nooptions.css')).to.equal(cssFile.contents.toString());
					done();
					cb();
				}));
		});

		it('should handle having an options object with an empty string base', function(done) {
			var files = [];

			gulp.src(path.normalize('test/fixtures/1/css/oneasset.css'), { base: 'test/fixtures/1' })
				.pipe(gulpUseCssUseRef({ base: '' }))
				.pipe(through.obj(function(file, enc, callback) {
					files.push(file);
					callback();
				}, function(cb) {
					expect(files).to.have.lengthOf(2);
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('fonts\\asset1.eot', path.sep));
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('css\\oneasset.css', path.sep));
					var cssFile = _.find(files, _.matches({relative: fixBackslashesInPath('css\\oneasset.css', path.sep)}));
					expect(cssFile).to.not.be.undefined;
					expect(getExpected('test/expected/nooptions.css')).to.equal(cssFile.contents.toString());
					done();
					cb();
				}));
		});

		it('should handle having an options object with a base that has a single level directory', function(done) {
			var files = [];

			gulp.src(path.normalize('test/fixtures/1/css/oneasset.css'), { base: 'test/fixtures/1' })
				.pipe(gulpUseCssUseRef({ base: 'foo' }))
				.pipe(through.obj(function(file, enc, callback) {
					files.push(file);
					callback();
				}, function(cb) {
					expect(files).to.have.lengthOf(2);
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('foo\\fonts\\asset1.eot', path.sep));
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('css\\oneasset.css', path.sep));
					var cssFile = _.find(files, _.matches({relative: fixBackslashesInPath('css\\oneasset.css', path.sep)}));
					expect(cssFile).to.not.be.undefined;
					expect(getExpected('test/expected/onelevel.css')).to.equal(cssFile.contents.toString());
					done();
					cb();
				}));
		});

		it('should handle having an options object with a base that has a 2 levels of directories', function(done) {
			var files = [];

			gulp.src(path.normalize('test/fixtures/1/css/oneasset.css'), { base: 'test/fixtures/1' })
				.pipe(gulpUseCssUseRef({ base: 'foo/bar' }))
				.pipe(through.obj(function(file, enc, callback) {
					files.push(file);
					callback();
				}, function(cb) {
					expect(files).to.have.lengthOf(2);
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('foo\\bar\\fonts\\asset1.eot', path.sep));
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('css\\oneasset.css', path.sep));
					var cssFile = _.find(files, _.matches({relative: fixBackslashesInPath('css\\oneasset.css', path.sep)}));
					expect(cssFile).to.not.be.undefined;
					expect(getExpected('test/expected/twolevels.css')).to.equal(cssFile.contents.toString());
					done();
					cb();
				}));
		});
	});

	describe('with an asset without ..\'s in it', function() {
		it('should handle not having an options object', function(done) {
			var files = [];

			gulp.src(path.normalize('test/fixtures/2/css/oneasset.css'), { base: 'test/fixtures/2' })
				.pipe(gulpUseCssUseRef())
				.pipe(through.obj(function(file, enc, callback) {
					files.push(file);
					callback();
				}, function(cb) {
					expect(files).to.have.lengthOf(2);
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('fonts\\Light\\asset1.eot', path.sep));
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('css\\oneasset.css', path.sep));
					var cssFile = _.find(files, _.matches({relative: fixBackslashesInPath('css\\oneasset.css', path.sep)}));
					expect(cssFile).to.not.be.undefined;
					expect(getExpected('test/expected/nodots/nooptions.css')).to.equal(cssFile.contents.toString());
					done();
					cb();
				}));
		});

		it('should handle having an options object with a null base', function(done) {
			var files = [];

			gulp.src(path.normalize('test/fixtures/2/css/oneasset.css'), { base: 'test/fixtures/2' })
				.pipe(gulpUseCssUseRef({ base: null }))
				.pipe(through.obj(function(file, enc, callback) {
					files.push(file);
					callback();
				}, function(cb) {
					expect(files).to.have.lengthOf(2);
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('fonts\\Light\\asset1.eot', path.sep));
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('css\\oneasset.css', path.sep));
					var cssFile = _.find(files, _.matches({relative: fixBackslashesInPath('css\\oneasset.css', path.sep)}));
					expect(cssFile).to.not.be.undefined;
					expect(getExpected('test/expected/nodots/nooptions.css')).to.equal(cssFile.contents.toString());
					done();
					cb();
				}));
		});

		it('should handle having an options object with an empty string base', function(done) {
			var files = [];

			gulp.src(path.normalize('test/fixtures/2/css/oneasset.css'), { base: 'test/fixtures/2' })
				.pipe(gulpUseCssUseRef({ base: '' }))
				.pipe(through.obj(function(file, enc, callback) {
					files.push(file);
					callback();
				}, function(cb) {
					expect(files).to.have.lengthOf(2);
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('fonts\\Light\\asset1.eot', path.sep));
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('css\\oneasset.css', path.sep));
					var cssFile = _.find(files, _.matches({relative: fixBackslashesInPath('css\\oneasset.css', path.sep)}));
					expect(cssFile).to.not.be.undefined;
					expect(getExpected('test/expected/nodots/nooptions.css')).to.equal(cssFile.contents.toString());
					done();
					cb();
				}));
		});

		it('should handle having an options object with a base that has a single level directory', function(done) {
			var files = [];

			gulp.src(path.normalize('test/fixtures/2/css/oneasset.css'), { base: 'test/fixtures/2' })
				.pipe(gulpUseCssUseRef({ base: 'foo' }))
				.pipe(through.obj(function(file, enc, callback) {
					files.push(file);
					callback();
				}, function(cb) {
					expect(files).to.have.lengthOf(2);
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('foo\\fonts\\Light\\asset1.eot', path.sep));
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('css\\oneasset.css', path.sep));
					var cssFile = _.find(files, _.matches({relative: fixBackslashesInPath('css\\oneasset.css', path.sep)}));
					expect(cssFile).to.not.be.undefined;
					expect(getExpected('test/expected/nodots/onelevel.css')).to.equal(cssFile.contents.toString());
					done();
					cb();
				}));
		});

		it('should handle having an options object with a base that has a 2 levels of directories', function(done) {
			var files = [];

			gulp.src(path.normalize('test/fixtures/2/css/oneasset.css'), { base: 'test/fixtures/2' })
				.pipe(gulpUseCssUseRef({ base: 'foo/bar' }))
				.pipe(through.obj(function(file, enc, callback) {
					files.push(file);
					callback();
				}, function(cb) {
					expect(files).to.have.lengthOf(2);
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('foo\\bar\\fonts\\Light\\asset1.eot', path.sep));
					expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('css\\oneasset.css', path.sep));
					var cssFile = _.find(files, _.matches({relative: fixBackslashesInPath('css\\oneasset.css', path.sep)}));
					expect(cssFile).to.not.be.undefined;
					expect(getExpected('test/expected/nodots/twolevels.css')).to.equal(cssFile.contents.toString());
					done();
					cb();
				}));
		});
	});

	it('shouldn\'t return duplicate assets', function(done) {
		var files = [];

		gulp.src(path.normalize('test/fixtures/1/css/dupasset.css'), { base: 'test/fixtures/1' })
			.pipe(gulpUseCssUseRef())
			.pipe(through.obj(function(file, enc, callback) {
				files.push(file);
				callback();
			}, function(cb) {
				expect(files).to.have.lengthOf(2);
				expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('fonts\\asset1.eot', path.sep));
				expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('css\\dupasset.css', path.sep));
				var cssFile = _.find(files, _.matches({relative: fixBackslashesInPath('css\\dupasset.css', path.sep)}));
				expect(cssFile).to.not.be.undefined;
				expect(getExpected('test/expected/dupasset.css')).to.equal(cssFile.contents.toString());
				done();
				cb();
			}));
	});

	it('should handle distinct assets on multiple lines', function(done) {
		var files = [];

		gulp.src(path.normalize('test/fixtures/1/css/multiassetmultiline.css'), { base: 'test/fixtures/1' })
			.pipe(gulpUseCssUseRef())
			.pipe(through.obj(function(file, enc, callback) {
				files.push(file);
				callback();
			}, function(cb) {
				expect(files).to.have.lengthOf(3);
				expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('fonts\\asset1.eot', path.sep));
				expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('fonts\\asset1.woff2', path.sep));
				expect(files).to.contain.something.that.has.property('relative', fixBackslashesInPath('css\\multiassetmultiline.css', path.sep));
				done();
				cb();
			}));
	});
});
