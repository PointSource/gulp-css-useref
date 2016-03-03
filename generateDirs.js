'use strict';

var path = require('path');
var url = require('url');

module.exports = generateDirs;


/**
 * Finds the base dir common to two paths.
 * For example '/a/b/c/d' and '/a/b/c/x/y' have '/a/b/c' in common.
 *
 * @param {string} a - path a
 * @param {string} b - path b
 * @returns {string} - the base dir common to both paths
 */
function getCommonBaseDir(a, b) {
	var common = [];
	a = a.split(path.sep);
	b = b.split(path.sep);
	for (var i = 0; i < a.length; i++) {
		if (b[i] === undefined || b[i] !== a[i]) {
			break;
		}
		common.push(a[i]);
	}
	return common.join(path.sep);
}


function generateDirs(cssFilePathAbs, cssFilePathRel, urlMatch, options) {
	// Example:
	//   cssFilePathAbs   = '\path\to\project\src\css\page\home.css'
	//   cssFilePathRel   = 'page\home.css'
	//   urlMatch         = '../../images/foo.png?a=123'
	//   options.base     = 'assets'

	// '\path\to\project\src\css\page\'
	var cssFromDirAbs = path.dirname(path.resolve(cssFilePathAbs));
	// 'css\page'
	var cssFromDirRel = path.dirname(cssFilePathRel);
	// assetUrlParsed.pathname = '../../images/foo.png'
	var assetUrlParsed = url.parse(urlMatch);
	// assetPath = '..\..\images\foo.png'
	var assetPath = assetUrlParsed.pathname.replace(/\//g, path.sep);
	// '\path\to\project\src\images\foo.png'
	var assetFromAbs = path.resolve(cssFromDirAbs, assetPath);
	// 'foo.png'
	var assetBasename = path.basename(assetPath);
	// '\path\to\project\src\images'
	var assetFromDirAbs = path.dirname(assetFromAbs);


	// '\path\to\project\src'
	var fromBaseDirAbs = getCommonBaseDir(assetFromDirAbs, cssFromDirAbs);
	// 'images'
	var assetPathPart = path.relative(fromBaseDirAbs, assetFromDirAbs);
	// 'assets\images'
	var newAssetPath = path.join(options.base, assetPathPart);
	// 'assets\images\foo.png'
	var newAssetFile = path.join(newAssetPath, assetBasename);

	// console.log(cssFromDirAbs, cssFromDirRel, assetUrlParsed, assetPath, assetFromAbs, assetBasename, assetFromDirAbs, fromBaseDirAbs, assetPathPart, newAssetPath, newAssetFile);

	// Call user-defined function
	if (options.pathTransform) {
		newAssetFile = options.pathTransform(newAssetFile, cssFilePathAbs, cssFilePathRel, urlMatch, options);
		newAssetPath = path.dirname(newAssetFile);
		assetBasename = path.basename(newAssetFile);
	}

	// 'foo.png?a=123'
	var urlBasename = assetBasename +
		(assetUrlParsed.search ? assetUrlParsed.search : '') +
		(assetUrlParsed.hash ? assetUrlParsed.hash : '');

	// 'url("../../images/foo.png?a=123")'
	var newUrl = 'url("' +
		path.relative(cssFromDirRel, newAssetPath).replace(new RegExp('\\'+path.sep, 'g'), '/') + '/' + urlBasename +
		'")';

	// Return the new url() string
	return {
		newUrl: newUrl,
		assetPath: assetPath,
		newAssetFile: newAssetFile
	};
}
