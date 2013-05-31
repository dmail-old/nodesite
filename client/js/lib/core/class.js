/*

name: Object.Proto

description: Prototype manipulation as merging, setting, getting prototype

provides: Object.create, Object.copy, Object.getPrototype, Object.setPrototype, Object.findPrototype, Object.findParentPrototype

*/

// create a new object still linked to source trough prototype. Consequently modifying source impacts the new object
Object.create = Object.create || function(source){
	var F = function(){};
	F.prototype = source;
	return new F();
};

var getPrototype;

if( typeof Object.getPrototypeOf == 'function' ) getPrototype = Object.getPrototypeOf;
else if( typeof 'test'.__proto__ === 'object' ) getPrototype = function(instance){ return instance.__proto__; };
// May break if the constructor has been tampered with
else getPrototype = function(instance){ return instance.constructor.prototype; };

Object.append(Object, {
	// create a deep copy of source through Object.create
	copy: function(source){
		var copy = Object.create(source), key, value;

		for(key in copy){
			value = copy[key];
			if( typeof value == 'object' && value != null ) copy[key] = Object.copy(value);
		}

		return copy;
	},

	// get constructor prototype from instance
	getPrototype: getPrototype,

	// set the prototype of a constructor
	setPrototype: function(constructor, prototype){
		if( prototype instanceof Function ) prototype = prototype.prototype;
		constructor.prototype = Object.copy(prototype);
		constructor.prototype.constructor = constructor;
	},

	// find first prototype defining key
	findPrototype: function(instance, key){
		var proto = Object.getPrototype(instance);

		while( proto ){
			if( key in proto ) return proto;
			proto = Object.getPrototype(proto);
		}

		return null;
	},

	// find first parent prototype defining a key
	findParentPrototype: function(instance, key){
		var proto = Object.findPrototype(Object.getPrototype(instance), key);

		return proto ? proto[key] : null;
	}
});

/*
---

name: Class

description: Function helping to create constructor Function

require: Object.create, Object.append

provides: Class

...
*/

var Class = window.Class = function(proto){
	if( !proto ){
		proto = {};
	}

	var parent = 'Extends' in proto ? proto.Extends : Class;

	// when the class doesn't define a constructor
	if( !proto.hasOwnProperty('constructor') ){
		// if this is a top class his constructor does nothing
		if( parent == Class ){
			proto.constructor = function(){
				return this;
			};
		}
		// else his constructor call his parent constructor
		else{
			proto.constructor = function(){
				return parent.prototype.constructor.apply(this, arguments);
			};
		}
	}

	var constructor = proto.constructor;

	Object.setPrototype(constructor, parent);
	constructor.implement(proto);

	if( 'Implements' in proto ){
		var items = proto.Implements;
		if( !(items instanceof Array) ) constructor.implement(items);
		else constructor.implement.apply(constructor, items);
	}

	return constructor;
};

Class.Interfaces = {};

Class.Interfaces.proto = {
	getPrototype: function(){
		return Object.getPrototype(this);
	},

	callProto: function(name){
		var method = Object.findPrototype(this, name);
		return typeof method == 'function' ? method.apply(this, toArray(arguments, 1)) : this;
	},

	applyProto: function(name, args){
		var method = Object.findPrototype(this, name);
		return typeof method == 'function' ? method.apply(this, args) : this;
	}
};

Class.Interfaces.parent = {
	callParent: function(name){
		var method = Object.findParentPrototype(this, name);
		if( typeof method != 'function' ) throw new Error('The method "' + name + '" has no parent.');
		return method.apply(this, toArray(arguments, 1));
	},

	applyParent: function(name, args){
		var method = Object.findParentPrototype(this, name);
		if( typeof method != 'function' ) throw new Error('The method "' + name + '" has no parent.');
		return method.apply(this, args);
	}
};

Class.Interfaces.options = this.Options = {
	setOptions: function(options){
		this.options = {};

		if( 'options' in this.constructor.prototype ){
			Object.merge(this.options, this.constructor.prototype.options);
		}
		if( options ){
			Object.merge(this.options, options);
		}

		return this;
	}
};

Class.Interfaces.chain = this.Chain = {
	resetChain: function(){
		this.$chain = [];
	},

	chain: function(){
		this.$chain.push(arguments);
		return this;
	},

	callChain: function(){
		if( this.$chain.length ){
			var
				call = this.$chain.shift(),
				method = call[0],
				bind = call[1] || this,
				args = call[2] || []
			;

			return method.apply(bind, args);
		}
		return false;
	},

	clearChain: function(){
		this.$chain = [];
		return this;
	}
};

Class.Interfaces.bound = this.Bound = {
	resetBound: function(){
		this.bound = {};
	},

	bind: function(){
		var bound = this.bound, i = arguments.length, key, value;

		while(i--){
			key = arguments[i];
			value = this[key];
			if( typeof value == 'function' ) bound[key] = value.bind(this);
		}

		return bound[key];
	}
};
