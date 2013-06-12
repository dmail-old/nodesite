/*

test files

en écrivant direct comme ça on peut concaténer les fichiers puisque le fichier et ce qu'il provide est
immédiatement stocké

require.id("superdependency");
provide({
	superdependency: true
});

require.id("dependency");
provide('superdependency', function(superdependency){
	superdependency.dependency = true;
	return superdependency;
});

require.id("provide");
provide('superdependency', function(superdependency){
	superdependency.dependency = true;
	return superdependency;
});

require('provide', function(provide){
	console.log(provide);
});

require.id("dependency");
provide({foo: 'bar'});

require.id("module");
require('dependency', function(dependency){
	dependency.more = true;
	provide(dependency);
});

require('module', function(module){
	console.log(module);
});

require.id("dep"); provide({foo: 'bar'}); require.id("mod"); require('dep', function(d){ d.more = true; provide(d); });

*/

/*

MORE
- dependencyTree qu'on remplit au fur et à mesure

tester avec un require sur plusieurs dependency
tester avec des require se suivant les un les autres

require('foo', 'bar', function(){ console.log(arguments); });

*/

function OnceEmitter(){
	this.listeners = {};
	this.test = arguments[0];
}

OnceEmitter.prototype.once = function(event, fn, bind){
	var listener = {fn: fn, bind: bind || this};

	if( event in this.listeners ){
		this.listeners[event].push(listener);
	}
	else{
		this.listeners[event] = [listener];
	}
};

OnceEmitter.prototype.emit = function(event, arg1){
	var listeners = this.listeners[event], i, listener;

	if( listeners ){
		i = listeners.length;
		while(i--){
			listener = listeners.shift();
			listener.fn.call(listener.bind, arg1);
		}
	}
};

function Module(id){
	this.id = id;
	this.emitter = new OnceEmitter(this);
}

Module.resolving = {};

Module.prototype.provide = function(data){
	this.data = data;
	this.emitter.emit('provide', data);
};

Module.prototype.onload = function(e){
	if( e && e.type == 'error' ) throw new Error('loadfail');

	console.log('module loaded', this.id);

	// no require call in this file
	if( this.beforeLoadRequire == require.current ){
		console.log('no require call in ', this.id);
		this.getProvide();
	}
	// the require as immediatly call provide
	else if( require.provided ){
		console.log('require immediatly provided in ', this.id);
		this.getProvide();
	}
	// a require call has occured in the file, wait for his resolution
	else{
		require.current.emitter.once('resolve', this.getProvide, this);
	}
};

Module.prototype.getProvide = function(){
	delete Module.resolving[this.id];

	var provided = require.provided;

	if( provided ){
		delete require.provided;
		this.provide(provided);
	}
	else{
		this.provide(null);
	}
};

Module.prototype.load = function(){
	require.loadFile(this.id, this.onload.bind(this));
};

Module.prototype.resolve = function(){
	if( 'data' in this ){
		this.emitter.emit('provide', this.data);
	}
	else if( this.id in Module.resolving ){
		if( Module.resolving[this.id] != this){
			Module.resolving[this.id].emitter.once('provide', this.provide, this);
		}
	}
	else{
		this.beforeLoadRequire = require.current;
		Module.resolving[this.id] = this;
		this.load();
	}
};

function require(dependencies){
	if( this instanceof require ){
		this.emitter = new OnceEmitter();
		this.dependencies = dependencies;
		if( dependencies.length > 0 && typeof dependencies[dependencies.length - 1] == 'function' ){
			this.callback = dependencies.pop();
		}
		require.current = this;
		this.start();
	}
	else{
		return new require(Array.apply(Array, arguments));
	}
}

require.cache = {};
require.config = {
	async: true,
	root: './',
	extension: 'js',
	charset: 'utf8'
};

require.filepath = function(name){
	return require.config.extension + '/' + name + '.' + require.config.extension;
};

require.fileURL = function(name){
	return require.config.root + require.filepath(name, require.config.extension);
};

require.loadFile = function(path, callback){
	var type, element;

	if( path.match(/.js$/) ){
		type = 'js';
		element = document.createElement('script');
		element.type = 'text/javascript';
		element.charset = require.config.charset;
		element.async = require.config.async;
	}
	else if( path.match(/.css$/) ){
		type = 'css';
		element = document.createElement('link');
		element.type = 'text/css';
		element.rel = 'stylesheet';
	}
	else{
		throw new Error('unsupported file extension');
	}

	if( typeof callback == 'function' ){
		element.onerror = callback;
		element.onload = callback;
	}

	document.head.appendChild(element);

	if( type == 'js' ) element.src = path;
	else element.href = path;
};

require.loadFiles = function(names, extension){
	var i = 0, j = names.length, prevExt = require.config.extension, prevAsync = require.config.async;

	require.config.extension = extension;
	require.config.async = false;
	for(;i<j;i++){
		require.loadFile(require.fileURL(names[i]));
	}
	require.config.extension = prevExt;
	require.config.async = prevAsync;

};

require.id = function(id){
	require.currentResolver.setId(id);
};

require.prototype.cache = require.cache;

require.prototype.parseId = function(id){
	return require.fileURL(id);
};

require.prototype.onresolve = function(){
	if( this.callback ){
		this.callback.apply(window, this.datas);
	}
	this.emitter.emit('resolve');
};

require.prototype.getModule = function(id){
	if( id in this.cache ) return this.cache[id];
	return this.cache[id] = new Module(id);
};

require.prototype.resolve = function(id){

	var module = this.getModule(id);

	module.emitter.once('provide', function(){

		this.datas[this.dependencies.indexOf(module.id)] = module.data;
		this.count++;

		if( this.count == this.dependencies.length ){
			this.onresolve();
		}

	}, this);

	module.resolve();
};

require.prototype.start = function(){
	this.count = 0;
	this.datas = [];

	var i = 0, j = this.dependencies.length, name;

	for(;i<j;i++){
		this.dependencies[i] = this.parseId(this.dependencies[i]);
		this.resolve(this.dependencies[i]);
	}

};

function provide(data){
	require.provided = data;
}

/*

in b.js
provide('b');

in a.js:
require('b', function(){
	provide('bar');
});

in foo.js
require('a', function(){
	provide('foo');
});

require('foo', 'a')

*/
