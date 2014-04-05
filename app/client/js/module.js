/*

inspiration:
https://github.com/joyent/node/blob/master/lib/module.js
https://github.com/joyent/node/blob/master/src/node.js 

*/

var Module = function(filename, parent){
	this.filename = filename;
	this.parent = parent;
	this.cache[filename] = this;
};

Module.prototype = {
	source: null,
	parent: null,
	exports: null,
	cache: {},

	hasExtension: function(filename, ext){
		return filename.indexOf(ext, filename.length - ext.length) !== -1;
	},

	resolve: function(path){
		return path;
	},

	_load: function(url, async){
		var xhr = new XMLHttpRequest();

		url = document.location.origin + '/' + url;
		
		xhr.open('GET', url, Boolean(async));
		if( this.parent ) xhr.setRequestHeader('x-required-by', this.parent.filename);
		xhr.send(null);

		if( xhr.readyState == 4 ){
			return this.getXhrResponse(xhr);
		}
		return xhr;
	},

	getXhrResponse: function(xhr){
		if( xhr.status == 200 || xhr.status === 0 ){
			return xhr.responseText;
		}
		return new Error('not found');
	},

	load: function(){
		if( this.source == null ){
			this.source = this._load(this.filename);
		}
		return this.source;
	},

	eval: function(source, filename){
		source+= '\n//# sourceURL='+ filename;
		return window.eval(source);
	},

	compile: function(){
		if( !this.hasOwnProperty('exports') ){

			var source, fn;

			try{
				source = this.load();
			}
			catch(e){
				// module not found ou autre
				throw e;
			}

			source = '(function(exports, require, module, __filename, __dirname){\n\n' + source + '\n\n)';	
			try{
				fn = this.eval(source, this.filename);
			}
			catch(e){
				// syntax error in module source or similar error
				throw e;
			}

			this.exports = {};
			try{
				source.apply(this.exports, this.exports, this.require.bind(this), this, this.filename, this.dirname);
			}
			catch(e){
				// execution of the module code raise an error
				throw e;
			}
		}
	},

	getCache: function(filename){
		if( filename in this.cache ){
			return this.cache[filename];
		}
		if( !this.hasExtension(filename, '.js') ){
			return this.getCache(filename + '.js') || this.getCache(filename + '/index.js');
		}
		return null;
	},

	createChild: function(filename){
		return new Module(filename, this);
	},

	require: function(path){
		var filename = this.resolve(path), module = this.getCache(filename);

		if( !module ){
			module = this.createChild(filename);
		}

		// may throw different errors as not found, syntax error and more
		module.compile();

		return module.exports;
	}
};

// main module
window.module = new Module('.');
window.require = window.module.require.bind(window.module);
window.__filename = window.module.filename;
window.__dirname = window.module.filename;

Module.prototype.Path = require('path');
Module.prototype.resolve = function(path){
	// resolve relative path
	if( path[0] == '/' || path.slice(0,2) == './' || path.slice(0,3) == '../' ){
		return this.Path.resolve(this.dirname, path);
	}
	// resolve absolute path
	else{
		return path;
	}
};
Object.defineProperty(Module.prototype, 'dirname', {
	get: function(){
		return this.Path.dirname(this.filename);
	}
});