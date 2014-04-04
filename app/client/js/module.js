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

	load: function(){
		var source = this.source;

		if( source == null ){
			var xhr = new XMLHttpRequest();

			// false for sync request
			xhr.open("GET", document.location.origin + '/node_modules/' + this.path, false);
			if( this.parent ) xhr.setRequestHeader('x-required-by', this.parent.filename);
			xhr.send(null);

			if( xhr.status === 200 || xhr.status === 0 ){
				source = xhr.responseText;
			}
			// file not found maybe we asked for a directory? try to find an index.js file in this directory
			else{
				throw new Error('module not found ' + path);
			}

			this.source = source;
		}

		return source;
	},

	_compile: function(source){
		var prefix = '(function(exports, require, module, __filename, __dirname){\n\n';
		var suffix = '\n\n)';

		source = prefix + source + suffix;
		source+= '\n//# sourceURL='+ this.filename;
		
		var fn = eval(source);
		fn.apply(this.exports, this.exports, this.require.bind(this), this, this.filename, this.dirname);
	},

	compile: function(){
		if( !this.hasOwnProperty('exports') ){
			// may fail (module not found)
			var source = this.load();

			this.exports = {};

			try{
				this._compile(source);
			}
			catch(e){
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

	require: function(path){
		var filename = this.resolve(path), module = this.getCache(filename);

		if( !module ){
			module = new Module(filename, this);
		}

		// may fail (module eval may throw errors)
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