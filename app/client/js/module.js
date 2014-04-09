/*

inspiration:
https://github.com/joyent/node/blob/master/lib/module.js
https://github.com/joyent/node/blob/master/src/node.js 

*/

var Module = function(id, parent){
	this.id = id;
	this.parent = parent;
};

Module.prototype = {
	// marche pas parce que selon d'ou je require l'id ne signifie pas la même chose
	// si je require depuis mainmodule 'app' signifie pas pareil que si je require depuis un autre module
	// est ce qu'on cherche un module pour require('app/ok.js') dans 'app/node_modules/ok.js??'
	resolvedIds: {},
	cache: {},
	path: null, // fully resolved path
	source: null,
	exports: null,
	
	_load: function(){
		var xhr = new XMLHttpRequest();

		xhr.open('GET', window.location.origin, false);
		xhr.setRequestHeader('x-required-by', this.parent.id);
		xhr.setRequestHeader('x-require', this.id);
		xhr.send(null);

		if( xhr.status >= 200 || this.status < 400 ){
			this.source = xhr.responseText;
			this.path = xhr.getResponseHeader('x-module-path');		
			return this.source;
		}

		throw new Error('not found');
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
	},

	createChild: function(url){
		return new Module(url, this);
	},

	resolve: function(id){
		if( id in this.resolvedIds ){
			return this.resolvedIds[id];
		}
		return null;
	},

	require: function(id){
		var path = this.resolve(id);

		if( path ){
			if( path in this.cache ){
				module = this.cache[path];
			}
			else{
				// bizarre non?
			}
		}
		else{
			module = this.createChild(id);
			module._load();
			this.resolvedIds[module.id] = module.path;
			this.cache[module.path] = module;
		}

		// may throw different errors as not found, syntax error and more
		module.compile();

		return module.exports;
	},

	get filename(){
		return this.path;
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
window.module.path = window.module.id;
window.require = window.module.require.bind(window.module);
window.__filename = window.module.filename;
window.__dirname = window.module.dirname;