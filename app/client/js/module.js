/*

inspiration:
https://github.com/joyent/node/blob/master/lib/module.js
https://github.com/joyent/node/blob/master/src/node.js 

*/

var Module = function(filename, parent){
	this.filename = filename; // fully resolved filename
	this.parent = parent; // parent all have on except main module
	this.resolvedPaths = {}; // contain path already resolved to filenames for this module
};

Module.prototype = {
	cache: {},
	source: null,
	exports: null,

	headers: {
		module: 'x-module',
		resolve: 'x-resolve',
		resolveParent: 'x-resolve-parent'
	},
	
	_resolve: function(){
		var xhr = new XMLHttpRequest();

		xhr.open('GET', window.location.origin, false);
		xhr.setRequestHeader(this.headers.resolve, this.filename);
		xhr.setRequestHeader(this.headers.resolveParent, this.parent.filename);
		xhr.send(null);

		if( xhr.status >= 200 || this.status < 400 ){
			return xhr.responseText;	
		}
		else{
			throw new Error('not found');
		}
	},

	resolve: function(path){
		if( path in this.resolvedPaths ){
			return this.resolvedPaths[path];
		}
		else{
			return this.resolvedPaths[path] = this._resolve(path);
		}
	},

	createChild: function(url){
		return new Module(url, this);
	},

	_load: function(){
		var xhr = new XMLHttpRequest();

		xhr.open('GET', window.location.origin, false);
		xhr.setRequestHeader(this.headers.module, this.filename);
		xhr.send(null);

		if( xhr.status >= 200 || this.status < 400 ){
			return xhr.responseText;	
		}
		else{
			throw new Error('not found');
		}
	},

	load: function(){
		if( this.source ) return this.source;
		return this.source = this._load();
	},

	eval: function(source, url){
		source+= '\n//# sourceURL='+ url;
		return window.eval(source);
	},

	compile: function(){
		if( !this.hasOwnProperty('exports') ){
			var source, fn;

			source = this.load();

			source = '(function(exports, require, module, __filename, __dirname){\n\n' + source + '\n\n)';	
			try{
				fn = this.eval(source, this.url);
			}
			catch(e){
				// syntax error in module source or similar error
				throw e;
			}

			this.exports = {};
			try{
				source.apply(this.exports, this.exports, this.require.bind(this), this, this.url, this.dirname);
			}
			catch(e){
				// execution of the module code raise an error
				throw e;
			}
		}

		return this.exports;
	},

	require: function(path){
		var filename = this.resolve(path);

		if( filename in this.cache ){
			module = this.cache[filename];
		}
		else{
			module = this.cache[filename] = this.createChild(filename);
		}
		
		return module.compile();
	},

	get dirname(){
		var path = this.filename, lastSlash;

		if( path.length > 1 && path[path.length - 1] == '/' ) path = path.replace(/\/+$/, '');

		lastSlash = path.lastIndexOf('/');
		switch(lastSlash){
		case -1:
			return '.';
		case 0:
			return '/';
		default:
			return path.substring(0, lastSlash);
		}
	}
};

// main module
window.module = new Module(window.location.origin.pathname);
window.require = window.module.require.bind(window.module);
window.__filename = window.module.filename;
window.__dirname = window.module.dirname;