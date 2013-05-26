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
	setPrototype: function(constructor, superConstructor){
		if( typeof superConstructor == 'object' ){
			constructor.prototype = superConstructor;
		}
		else if( superConstructor instanceof Function ){
			var initialize = superConstructor.prototype.initialize, instance;

			// don't call parent constructor
			if( initialize ){
				superConstructor.prototype.initialize = Function.EMPTY;
			}
			// copy superConstructor.prototype, that way modifying super impact constructor but not the opposite
			instance = Object.copy(new superConstructor());
			if( initialize ){
				superConstructor.prototype.initialize = initialize;
			}

			constructor.prototype = instance;
		}
		constructor.prototype.constructor = constructor;

		return constructor;
	},

	// find first prototype defining key
	findPrototype: function(instance, key){
		var proto = Object.getPrototype(instance);

		while( proto ){
			if( key in proto ) return proto[key];
			proto = Object.getPrototype(proto);
		}

		return null;
	},

	// find first parent prototype defining a key
	findParentPrototype: function(instance, key){
		return Object.findPrototype(Object.getPrototype(instance), key);
	}
});

/*
---

name: Class

description: Function helping to create and manipulate Class

require: Implement, Object.Proto,

provides: Class

help:

// the object passed to Class will be merged to the prototype of an anonymous function who calls this.initialize
new Class({
	// the prototype is set to new parentClass
	Extends: parentClass,
	// the prototype is merged with the interface provided
	Implements: [Interface1, Interface2],
	// the constructor called by new Class()
	initialize: function(){

	},
	// ... more methods and properties
});

...
*/

var Class = window.Class = function(proto){
	var fn = function(){
		// called with new
		if( this instanceof fn ){
			return this.initialize ? this.initialize.apply(this, arguments) : this;
		}
		// called without new
		else{
			return fn.toInstance ? fn.toInstance.apply(fn, arguments) : this;
		}
	};

	if( proto ){
		for(var key in Class.Mutators){
			if( key in proto ){
				Class.Mutators[key].call(fn, proto[key]);
			}
		}

		fn.implement(proto);
	}

	return fn;
};

Class.Mutators = {
	Extends: function(parent){
		Object.setPrototype(this, parent);
		this.implement(Class.Interfaces.parent);
	},

	Implements: function(items){
		if( !(items instanceof Array) ) items = [items];
		items.forEach(function(item){
			if( typeof item == 'string' ) item = Class.Interfaces[item];
			if( typeof item == 'object' || typeof item == 'function' ) this.implement(item);
			else throw new TypeError(item + ' must be an object or a constructor');
		}, this);
	}
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

Class.Interfaces.chain = this.Chain = new Class({
	initialize: function(){
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
});

Class.Interfaces.bound = this.Bound = new Class({
	initialize: function(){
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
});