/*

inspiration:
https://github.com/joyent/node/blob/master/lib/module.js
https://github.com/joyent/node/blob/master/src/node.js 

*/

var Module = function(url, parent){
	this.url = new window.URL(url, parent ? parent.url : null);
	this.parent = parent;
};

Module.prototype = {
	resolvedURLS: {},
	cache: {},
	source: null,
	exports: null,
	
	_resolve: function(url){
		var xhr = new XMLHttpRequest();

		xhr.open('GET', window.location.origin, false);
		xhr.setRequestHeader('x-required-by', this.url);
		xhr.setRequestHeader('x-require', url);
		xhr.send(null);

		if( xhr.status >= 200 || this.status < 400 ){
			this.source = xhr.responseText;
			return xhr.getResponseHeader('x-module-url');
		}

		throw new Error('not found');
	},

	resolve: function(url){
		if( url in this.resolvedUrls ){
			return this.resolvedUrls[url];
		}
		return this._resolve(url);
	},

	eval: function(source, url){
		source+= '\n//# sourceURL='+ url;
		return window.eval(source);
	},

	compile: function(){
		if( !this.hasOwnProperty('exports') ){

			var source = this.source, fn;

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
		url = this.resolve(url);

		if( url in this.cache ){
			module = this.cache[url];
		}
		else{
			module = this.cache[url] = this.createChild(url);
		}

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