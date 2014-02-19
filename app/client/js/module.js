var Module = function(path){
	this.path = path;
	this.filename = this.Path.normalize(path);
	this.dirname = this.Path.dirname(this.filename);

	if( this.filename != 'index.js' && this.Path.basename(this.filename) == 'index.js' ){
		this.cache[this.filename.slice(0, -('/index.js'.length))] = this;
	}

	this.cache[this.filename] = this;
	this.exports = {};
};

Module.prototype = {
	Path: NS.path,
	cache: {},

	hasExtension: function(filename, ext){
		return filename.indexOf(ext, filename.length - ext.length) !== -1;
	},

	ensureExtension: function(filename, ext){
		if( !this.hasExtension(filename, ext) ){
			filename = filename + ext;
		}
		return filename;
	},

	load: function(filename){
		var xhr = new XMLHttpRequest();

		console.log(this.filename + ' require ' + filename);

		// false for sync request
		xhr.open("GET", document.location.origin + '/node_modules/' + filename, false);
		xhr.send(null);

		return xhr;					
	},

	getCache: function(filename){
		if( filename in this.cache ){
			return this.cache[filename];
		}
		if( !this.hasExtension(filename, '.js') ){
			return this.getCache(filename + '.js');
		}
		return null;
	},

	require: function(path){
		//var givenPath = path;
		path = this.resolve(path);
		var cache = this.getCache(path);

		if( cache ){
			return cache.exports;
		}
		else{
			var xhr = this.load(path), response;

			if( xhr.status === 200 || xhr.status === 0 ){
				response = xhr.responseText;
			}
			// file not found maybe we asked for a directory? try to find an index.js file in this directory
			else{
				throw new Error('module not found ' + path);
			}

			try{
				eval(response + '\n//@sourceURL='+ path);
			}
			catch(e){
				throw e;
			}

			cache = this.getCache(path);

			if( cache ){
				return cache.exports;
			}
			else{
				throw new Error(path + ' has not called new Module() or the path is invalid');
			}
		}
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