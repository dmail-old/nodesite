/*

ceci marche, c'est l'exemple ultime
des provide direct et des require sur des trucs en cache ou distant suivi de provide

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

function Module(id){

	if( id in this.cache ) return this.cache[id];
	this.cache[id] = this;

	this.id = id;
	this.provideListeners = new BindedFunctionList();
}

Module.prototype.cache = {};

Module.prototype.provide = function(data){
	this.exports = data;
	this.onprovide();
};

Module.prototype.onprovide = function(){
	this.provideListeners.callEachOnce();
};

Module.prototype.onload = function(e){
	this.loaded = true;
};

Module.prototype.onerror = function(e){
	//throw new Error(e);
};

Module.prototype.load = function(){};

function require(dependencies, callback, bind){
	if( this instanceof require ){
		this.state = this.UNRESOLVED;
		this.resolveListeners = new BindedFunctionList();
		this.setDependencies(dependencies);
		if( callback ){
			this.resolveListeners.add(callback, bind);
		}

		return this.resolve();
	}
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

// initial state
require.prototype.UNRESOLVED = 'unresolved';
// when the module wait for a child resolution (the child callled require)
require.prototype.RESOLVING = 'resolving';
// when the module has been resolved
require.prototype.RESOLVED = 'resolved';

require.prototype.setDependencies = function(dependencies){
	var i = 0, j = dependencies.length;

	this.dependencies = [];
	for(;i<j;i++){
		this.dependencies[i] = new Module(dependencies[i]);
	}
};

require.prototype.getExports = function(module){
	return module.exports;
};

require.prototype.onresolve = function(){
	this.state = this.RESOLVED;
	this.resolveListeners.applyEachOnce(this.dependencies.map(this.getExports));
};

require.prototype.resolveModule = function(module){

	module.provideListeners.add(function(){
		this.count++;
		if( this.count == this.dependencies.length ){
			this.onresolve();
		}
	}, this);

	if( 'exports' in module ){
		module.onprovide();
	}
	else if( typeof module.loaded == 'undefined' ){
		module.loaded = false;
		module.load();
	}
};

require.prototype.resolve = function(){
	this.state = this.RESOLVING;
	this.count = 0;

	var i = 0, j = this.dependencies.length, dependency;
	for(;i<j;i++){
		dependency = this.dependencies[i];
		this.resolveModule(dependency);
	}

	return this;
};

function provide(id, data){
	new Module(id).provide(data);
}

require.cache = Module.prototype.cache;
