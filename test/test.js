/* eslint-disable */
/* global describe, it */
'use strict';
var path = require('path');
var chai = require('chai');
var expect = chai.expect;
var gulp = require('gulp');
var through = require('through2');
var generateDirs = require('../generateDirs');

chai.config.includeStack = false;

describe('generateDirs()', function() {
	this.timeout(5000);

	it('should work with a CSS file with a heirarchy of 2 directories in it\'s relative path', function() {
		console.log('x',path.relative('C:\\gulp-css-useref\\test\\fixtures\\01.css', 'test\\fixtures\\01.css'));
		console.log('x2',path.relative('test\\fixtures\\01.css', 'C:\\gulp-css-useref\\test\\fixtures\\01.css'));
		console.log('y',path.resolve('.'), path.resolve('C:\\gulp-css-useref\\test\\fixtures\\01.css', 'test\\fixtures\\01.css'));
		var dirs = generateDirs('C:\\gulp-css-useref\\test\\fixtures\\01.css', 'test\\fixtures\\01.css', '../fonts/font1.woff?a=123', { base: 'fonts'});
		console.log(dirs);
		expect(dirs).to.eql({
			newUrl: 'url("../../fonts/fonts/font1.woff?a=123")',
			assetPath: '..\\fonts\\font1.woff',
			newAssetFile: 'fonts\\fonts\\font1.woff'
		});
	});

	it('should work with a CSS file with a heirarchy of 2 directories in it\'s relative path', function(done) {
		gulp.src(path.join('test/fixtures/01.css'), { base: '.', buffer: false })
			.pipe(through.obj(function(cssFile, enc, callback) {
				console.log(cssFile.cwd, cssFile.base, cssFile.path, cssFile.relative)
				console.log(path.resolve(cssFile.cwd, cssFile.base));
				var dirs = generateDirs(cssFile.path, cssFile.relative, '../fonts/font1.woff?a=123', { base: 'fonts'});
				console.log(dirs)
				expect(dirs.newUrl).to.equal('url("../../fonts/fonts/font1.woff?a=123")');
				expect(dirs.assetPath).to.equal('..\\fonts\\font1.woff');
				expect(dirs.newAssetFile).to.equal(path.normalize('fonts/fonts/font1.woff'));
				callback();
			}, function (cb) {
				done();
				cb();
			}));
	});

	it('should work with a CSS file with a heirarchy of 1 directory in it\'s relative path', function(done) {
		gulp.src(path.join('test/fixtures/01.css'), { base: 'test', buffer: false })
			.pipe(through.obj(function(cssFile, enc, callback) {
				console.log(cssFile.cwd, cssFile.base, cssFile.path, cssFile.relative)
				console.log(path.resolve(cssFile.cwd, cssFile.base));
				var dirs = generateDirs(cssFile.path, cssFile.relative, '../fonts/font1.woff?a=123', { base: 'fonts'});
				console.log(dirs)
				expect(dirs.newUrl).to.equal('url("../fonts/fonts/font1.woff?a=123")');
				expect(dirs.assetPath).to.equal('..\\fonts\\font1.woff');
				expect(dirs.newAssetFile).to.equal(path.normalize('fonts/fonts/font1.woff'));
				callback();
			}, function (cb) {
				done();
				cb();
			}));
	});

	it('should work with a CSS file who\'s relative path doesn\'t have a directory', function(done) {
		gulp.src(path.join('test/fixtures/01.css'), { buffer: false })
			.pipe(through.obj(function(cssFile, enc, callback) {
				console.log('--------------')
				console.log(cssFile.cwd, cssFile.base, cssFile.path, cssFile.relative);
				console.log(path.resolve(path.dirname(cssFile.path), 'fonts/font1.woff'));
				console.log('--------------')
				var dirs = generateDirs(cssFile.path, cssFile.relative, 'fonts/font1.woff?a=123', { base: 'fonts'});
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
