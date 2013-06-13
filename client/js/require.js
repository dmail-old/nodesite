/*

ceci marche, c'est l'exemple ultime
des provide direct et des require sur des trucs en cache ou distant suivi de provide

require.id('a');
provide('a');

require.id('b');
require('a', 'foo', function(){
	provide('b');
});

require('b', console.log, console);

*/

function BindedFunctionList(){

}
BindedFunctionList.prototype = [];

BindedFunctionList.prototype.add = function(fn, bind){
	this.push({fn: fn, bind: bind || this});
};

BindedFunctionList.prototype.applyEachOnce = function(args){
	var i = this.length, fn;

	while(i--){
		fn = this.shift();
		fn.fn.apply(fn.bind, args);
	}

	return this;
};

BindedFunctionList.prototype.callEachOnce = function(){
	return this.applyEachOnce(arguments);
};

function require(dependencies, callback, bind){
	// called with new
	if( this instanceof require ){

		this.listeners = new BindedFunctionList();
		this.dependencies = dependencies;

		if( callback ){
			this.listeners.add(callback, bind);
		}

		// when this require resolve, the simulated module will do getprovide
		if( require.module ){
			this.listeners.add(require.module.getProvide, require.module);
			delete require.module;
		}

		require.current = this;
		this.start();
	}
	// called without new
	else{
		return require.new(require, arguments);
	}
}

require.new = function(constructor, args){
	var dependencies, callback, bind;

	if( args[0] instanceof Array ){
		dependencies = args[0];
		callback = args[1];
		bind = args[2];
	}
	else{
		dependencies = [];
		var i = 0, j = args.length, arg;

		for(;i<j;i++){
			arg = args[i];
			if( typeof arg == 'string' ){
				dependencies.push(arg);
			}
			else if( typeof arg == 'function' ){
				callback = arg;
				bind = args[i+1];
				break;
			}
		}
	}

	return new constructor(dependencies, callback, bind);
};

require.extend = function(properties){
	var proto = Object.create(require.prototype), key;

	if( properties ){
		for(key in properties){
			proto[key] = properties[key];
		}
	}

	function constructor(){
		if( this instanceof constructor ){
			require.apply(this, arguments);
		}
		else{
			require.new(constructor, arguments);
		}
	}

	proto.constructor = constructor;
	constructor.prototype = proto;

	return constructor;
};

function Module(require, name){
	this.require = require;
	this.name = name;
	this.id = this.resolveName(name);
	this.listeners = new BindedFunctionList();
}

require.Module = Module;

Module.prototype.resolving = {};

Module.prototype.resolveName = function(name){
	return this.require.root + '/' + name + '.' + this.require.extension;
};

Module.prototype.onprovide = function(data){
	this.listeners.callEachOnce(data);
};

Module.prototype.provide = function(data){
	this.data = data;
	this.onprovide(data);
};

Module.prototype.onerror = function(e){
	//throw new Error('loadfail' + e);
};

Module.prototype.onload = function(e){
	this.loaded = true;

	// no require call in this file
	if( this.beforeLoadRequire == require.current ){
		this.getProvide();
	}
	// the require as immediatly call provide
	else if( require.provided ){
		this.getProvide();
	}
	// a require call has occured in the file, wait for his resolution
	else{
		require.current.listeners.add(this.getProvide, this);
	}

};

Module.prototype.getProvide = function(){
	delete this.resolving[this.id];

	var provided = require.provided;

	if( provided ){
		delete require.provided;
		this.provide(provided);
	}
	else{
		this.provide(null);
	}
};

Module.prototype.load = function(){};

Module.prototype.resolve = function(){
	if( 'data' in this ){
		this.onprovide(this.data);
	}
	else if( this.id in this.resolving ){
		var module = this.resolving[this.id];
		if( module != this ){
			module.listeners.add(this.provide, this);
		}
	}
	else{
		this.resolving[this.id] = this;
		// simulated module dont need to load they just wait provide calls
		if( !this.simulated ){
			this.beforeLoadRequire = require.current;
			this.load();
		}
	}
};

require.prototype.cache = {};
require.prototype.root = './';
require.prototype.extension = 'js';
require.prototype.Module = Module;

require.prototype.getModule = function(name){
	if( name in this.cache ) return this.cache[name];
	return this.cache[name] = new this.Module(this, name);
};

require.prototype.resolve = function(name){

	var module = this.getModule(name);

	module.listeners.add(function(){

		this.datas[this.dependencies.indexOf(module.name)] = module.data;
		this.count++;

		if( this.count == this.dependencies.length ){
			this.listeners.applyEachOnce(this.datas);
		}

	}, this);

	module.resolve();
};

require.prototype.start = function(){
	this.count = 0;
	this.datas = [];

	var i = 0, j = this.dependencies.length;

	for(;i<j;i++){
		this.resolve(this.dependencies[i]);
	}
};

require.cache = require.prototype.cache;

function provide(data){

	// simulated module
	var module = require.module;
	if( module ){
		delete require.module;
		module.provide(data);
	}
	else{
		require.provided = data;
	}
}

// the next immediate provide call or the next require resolved
// will provide a simulated id module
// usefull for file concat
require.id = function(id){
	require.module = require.prototype.getModule(id);
	require.module.simulated = true;
};
