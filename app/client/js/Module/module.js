/*

inspiration:
https://github.com/joyent/node/blob/master/lib/module.js
https://github.com/joyent/node/blob/master/src/node.js 

http://fredkschott.com/post/2014/06/require-and-the-module-system/?utm_source=nodeweekly&utm_medium=email

*/

var Module = {
	cache: {},
	filename: null, // fully resolved filename
	parent: null, // module that called require() on this one
	children: null, // require() call in this one
	resolvedPaths: null, // contain path already resolved to filenames for this module
	source: null,
	exports: null,

	headers: {
		module: 'x-module',
		resolve: 'x-resolve',
		resolveParent: 'x-resolve-parent'
	},

	constructor: function(filename, parent){
		if( filename in this.cache ){
			return this.cache[filename];
		}
		
		this.cache[filename] = this;
		this.filename = filename;
		this.parent = parent;
		this.resolvedPaths = {};
		this.children = [];

		if( parent ){
			parent.children.push(this);
		}
	},

	_resolve: function(path){
		var xhr = new XMLHttpRequest();

		xhr.open('GET', window.location.origin, false);
		xhr.setRequestHeader(this.headers.resolveParent, this.filename);
		xhr.setRequestHeader(this.headers.resolve, path);
		xhr.send(null);

		if( xhr.status >= 200 && xhr.status < 400 ){
			if( !xhr.responseText ){
				throw new Error('No body response to resolve request');
			}
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

	createChild: function(filename){
		return new Module(filename, this);
	},

	loadSync: function(){
		if( this.source ) return this.source;

		var xhr = new XMLHttpRequest();

		xhr.open('GET', window.location.origin, false);
		xhr.setRequestHeader(this.headers.module, this.filename);
		xhr.send(null);

		if( xhr.status >= 200 && xhr.status < 400 ){
			this.source = xhr.responseText;
			return this.source;
		}
		else{
			throw new Error('not found');
		}
	},

	load: function(fn){
		if( this.source ) return fn.call(this, null, this.source);

		var xhr = new XMLHttpRequest(), module = this;

		xhr.open('GET', window.location.origin, true);
		xhr.setRequestHeader(this.headers.module, this.filename);
		xhr.send(null);

		xhr.onreadystatechange = function(){
			if( this.readyState == 4 ){
				if( this.status >= 200 || this.status < 400 ){
					module.source = xhr.responseText;
					fn.call(module, null, module.source);
				}
				else{
					fn.call(module, new Error('not found'));
				}
			}
		};
	},

	eval: function(source, url){
		source+= '\n//# sourceURL='+ url;
		return window.eval(source);
	},

	compile: function(){
		if( !this.hasOwnProperty('exports') ){
			var source, fn;

			source = this.loadSync();

			source = '(function(exports, require, module, __filename, __dirname){\n\n' + source + '\n\n})';	
			try{
				fn = this.eval(source, this.filename);
			}
			catch(e){
				// syntax error in module source or similar error
				throw e;
			}

			this.fn = fn;

			this.exports = {};
			try{
				fn.call(this.exports, this.exports, this.require.bind(this), this, this.filename, this.dirname);
			}
			catch(e){
				// execution of the module code raise an error
				throw e;
			}
		}

		return this.exports;
	},

	require: function(path){
		var filename, module, exports;

		filename = this.resolve(path);
		module = this.createChild(filename);
		exports = module.compile();
		
		return exports;
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

Module.constructor.prototype = Module;
Module = Module.constructor;

// main module
window.module = new Module(window.location.pathname);
window.require = window.module.require.bind(window.module);
window.__filename = window.module.filename;
window.__dirname = window.module.dirname;