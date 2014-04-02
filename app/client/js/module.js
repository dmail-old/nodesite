/*



inspiration:
https://github.com/joyent/node/blob/master/lib/module.js
https://github.com/joyent/node/blob/master/src/node.js 



*/

var Module = function(filename, parent){
	this.filename = filename;
	this.parent = parent;
	this.exports = {};
};

Module.prototype = {
	source: null,
	parent: null,
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

	prefix: '\n(function(exports, require, module, __filename, __dirname){\n\n',
	suffix: '\n\n}).call(module.exports, module.exports, module.require.bind(module), module, module.filename, module.dirname);\n',

	wrap: function(script){
		return this.prefix + script + this.suffix;
	},

	compile: function(){
		// may fail (module not found)
		var source = this.load();

		source = this.wrap(source);

		try{
			var prevmodule = window.module;

			window.module = this;
			eval(source + '\n//# sourceURL='+ this.filename);
			window.module = prevmodule;
		}
		catch(e){
			throw e;
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

		if( module ){
			return module.exports;
		}
		else{
			module = new Module(filename, this);

			this.cache[filename] = module;

			// may fail (module eval may throw errors)
			module.compile();

			return module.exports;
		}
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