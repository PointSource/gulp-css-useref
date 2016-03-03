'use strict';

var fs = require('fs');
var through = require('through2');
var gutil = require('gulp-util');
var micromatch = require('micromatch');
var generateDirs = require('./generateDirs');

module.exports = function(options) {
	var options = options || {};

	return through.obj(function(file, cb) {
		var files;

		if (file.isNull())
			return cb(null, file);

		if (file.isStream())
			return cb(new gutil.PluginError('gulp-css-useref', 'Streaming not supported'));

		processUrlDecls.call(this, file, options);

		// Push the updated CSS file through.
		this.push(file);

		cb();
	});
};


function processUrlDecls(file, options) {
	// Replace 'url()' parts of Declaration
	file.contents = file.contents.toString().replace(/url\((.*?)\)/g,
		function (fullMatch, urlMatch) {
			// Example:
			//   fullMatch		  = 'url("../../images/foo.png?a=123");'
			//   urlMatch         = '"../../images/foo.png?a=123"'
			//   options.base     = 'assets'
			//   file.relative    = 'src/css/page/home.css'

			// "../../images/foo.png?a=123" -> ../../images/foo.png?a=123
			var urlMatch = trimUrlValue(urlMatch);

			// Ignore absolute urls, data URIs, or hashes
			if (urlMatch.indexOf('/') === 0 ||
				urlMatch.indexOf('data:') === 0 ||
				urlMatch.indexOf('#') === 0 ||
				/^[a-z]+:\/\//.test(urlMatch)) {
				return fullMatch;
			}

			if (options.match && !micromatch.isMatch(urlMatch, options.match)
				return fullMatch;

			var dirs = generateDirs(file.path, file.relative, urlMatch, options);
			var newUrl = dirs.newUrl;
			var assetFromAbs = dirs.assetFromAbs;
			var newAssetFile = dirs.newAssetFile;

			var cssFromDirAbs = path.dirname(file.path);

			// Read the asset
			var contents;
			try {
				contents = fs.readFileSync(assetFromAbs);
			} catch(e) {
				gutil.log('gulp-css-useref: Can\'t read asset file "' + assetFromAbs + '" referenced in "' + file.path + '". Ignoring.');
				return fullMatch;
			}

			var asset = new gutil.File({
				base: cssFromDirAbs,
				path: newAssetFile,
				contents: contents
			});
			this.push(asset);

			// Return the new url() string
			return newUrl;
		}.bind(this)
	);
}
