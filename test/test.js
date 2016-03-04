/* eslint-disable */
/* global describe, it */
'use strict';
var path = require('path');
var chai = require('chai');
var expect = chai.expect;
var gulp = require('gulp');
var through = require('through2');
var mockery = require('mockery');
var _ = require('lodash');

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
		it: 'should work with a blank base',
		args: [ 'fixtures\\01.css', 'fonts/font1.woff?a=123', { base: '' } ],
		res: {
			newUrl: 'url("../fonts/font1.woff?a=123")',
			assetPath: 'fonts\\font1.woff',
			newAssetFile: 'fonts\\font1.woff'
		}
	}
];


function generateTestData(sep) {
	return testData.map(function(testItem) {
		return {
			it: testItem.it,
			args: [ testItem.args[0].replace(/\\/g, sep), testItem.args[1], { base: testItem.args[2].base.replace(/\\/g, sep) } ],
			res: {
				newUrl: testItem.res.newUrl,
				assetPath: testItem.res.assetPath.replace(/\\/g, sep),
				newAssetFile: testItem.res.newAssetFile.replace(/\\/g, sep)
			}
		};
	});
}


before(function() {
	mockery.enable({
		warnOnReplace: true
	});
});

after(function() {
	mockery.disable();
});

describe('generateDirs() with OS local paths', function() {
	var generateDirs;

	var localTestData = generateTestData(path.sep);

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
		var incssFilePathReldirs = 'css\\page\\home.css';
		var inurlMatch = '../../images/foo.png?a=123';
		var inoptions = {
			base: 'assets',
			pathTransform: function(newAssetFile, cssFilePathRel, urlMatch, options) {
				expect(newAssetFile).to.equal('assets\\images\\foo.png');
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

describe('generateDirs() with posix paths', function() {
	var generateDirs;

	var localTestData = generateTestData(path.posix.sep);

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


describe('generateDirs() with win32 paths', function() {
	var generateDirs;

	var localTestData = generateTestData(path.win32.sep);

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

xdescribe('gulp-use-css filter', function() {
	it('should work with a CSS file who\'s relative path doesn\'t have a directory', function(done) {
		gulp.src(path.join('test/fixtures/01.css'), { buffer: false })
			.pipe(through.obj(function(cssFile, enc, callback) {
				console.log(cssFile.cwd, cssFile.base, cssFile.path, cssFile.relative);
				console.log(path.resolve(path.dirname(cssFile.path), 'fonts/font1.woff'));
				var dirs = generateDirs(cssFile.relative, 'fonts/font1.woff?a=123', { base: 'fonts'});
				console.log(dirs)
				expect(dirs.newUrl).to.equal('url("fonts/fonts/font1.woff?a=123")');
				expect(dirs.assetPath).to.equal('fonts\\font1.woff');
				expect(dirs.newAssetFile).to.equal(path.normalize('fonts/fonts/font1.woff'));
				callback();
			}, function (cb) {
				done();
				cb();
			}));
	});
});
