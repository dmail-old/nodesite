/*
C'est le client qui va s'occuper de wrap le script

// https://github.com/joyent/node/blob/master/lib/module.js
// native module dans https://github.com/joyent/node/blob/master/src/node.js

le serveur va passer au client un array de javascript à wrapper et à évaluer
pour qu'on puisse avoir ça en cache

du coup faut modifier le code de require

*/

var Module = function(filename){
	this.filename = filename;
	this.cache[this.filename] = this;
	this.exports = {};
};

Module.prototype = {
	Path: NS.path,
	source: null,
	cache: {},

	get dirname(){
		return this.Path.dirname(this.filename);
	},

	hasExtension: function(filename, ext){
		return filename.indexOf(ext, filename.length - ext.length) !== -1;
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

	resolve: function(path){
		// resolve relative path
		if( path[0] == '/' || path.slice(0,2) == './' || path.slice(0,3) == '../' ){
			return this.Path.resolve(this.dirname, path);
		}
		// resolve absolute path
		else{
			return path;
		}
	},

	load: function(parentModule){
		if( this.source ) return this.source; 

		var xhr = new XMLHttpRequest();

		// false for sync request
		xhr.open("GET", document.location.origin + '/node_modules/' + this.path, false);
		if( parentModule ) xhr.setRequestHeader('x-required-by', parentModule.path);
		xhr.send(null);

		if( xhr.status === 200 || xhr.status === 0 ){
			response = xhr.responseText;
		}
		// file not found maybe we asked for a directory? try to find an index.js file in this directory
		else{
			throw new Error('module not found ' + path);
		}

		return this.source = response;
	},

	prefix: '\n(function(exports, require, module, __filename, __dirname){\n\n',,
	suffix: '\n\n}).call(module.exports, module.exports, module.require.bind(module), module, module.path, module.dirname);\n',

	wrap: function(code){
		return this.prefix + code + this.suffix;
	},

	compile: function(){
		var source = this.wrap(this.source);

		try{
			var prevmodule = window.module;

			window.module = this;
			eval(source + '\n//# sourceURL='+ this.path);
			window.module = prevmodule;
		}
		catch(e){
			throw e;
		}
	},

	require: function(path){
		//var givenPath = path;
		path = this.resolve(path);

		var module = this.getCache(path);

		if( module ){
			return module.exports;
		}
		else{
			module = Module.new(path);

			// may fail (module not found)
			module.load(this);
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
window.__dirname = window.module.dirname;

/*
// mainModule
var mainModule = new Module('.');
// require a submodule
var submodule = new Module('db/insert');
// that require an other module in the same directory
var samedirectorymodule = new Module(submodule.resolve('./remove'));

// le mainmodule require le même remove module
console.log(mainModule.resolve('./db/remove') ==  samedirectorymodule.filename);
*/