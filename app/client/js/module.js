/*

inspiration:
https://github.com/joyent/node/blob/master/lib/module.js
https://github.com/joyent/node/blob/master/src/node.js 

*/

var Module = function(url, parent){
	url = new window.URL(url, parent ? parent.url : null);

	var instance = this.getCache(url);	

	if( instance ){
		return instance;
	}
	else{
		this.url = url;	
		this.parent = parent;
		this.cache[this.url] = this;
		return this;
	}	
};

Module.prototype = {
	cache: {},

	hasExtension: function(filename, ext){
		return filename.indexOf(ext, filename.length - ext.length) !== -1;
	},

	getCache: function(url){
		var module = null;

		if( url in this.cache ){
			module = this.cache[url];
		}
		else if( !this.hasExtension(url.pathname, '.js') ){
			
			url.pathname+= '.js';
			module = this.getCache(url);
			if( module ) return module;

			url.pathname = url.pathname.slice(0, -'.js'.length) + '/index.js';
			module = this.getCache(url);
			if( module ) return module;
		}

		return module;
	},

	source: null,
	exports: null,
	
	_load: function(url, async){
		var xhr = new XMLHttpRequest();
		
		xhr.open('GET', url, Boolean(async));
		
		if( url.origin == window.location.origin ){
			xhr.setRequestHeader('x-module', true);
			if( this.parent ) xhr.setRequestHeader('x-required-by', this.parent.url);
		}
		
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
			this.source = this._load(this.url);
		}
		return this.source;
	},

	eval: function(source, url){
		source+= '\n//# sourceURL='+ url;
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
	},

	createChild: function(url){
		return new Module(url, this);
	},

	require: function(url){
		var module = module.createChild(url);
		// may throw different errors as not found, syntax error and more
		module.compile();
		return module.exports;
	},

	get filename(){
		return this.url.pathname;
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
window.module = new Module(window.location.origin);
window.require = window.module.require.bind(window.module);
window.__filename = window.module.filename;
window.__dirname = window.module.dirname;