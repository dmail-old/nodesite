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

description: Function helping to create constructor Function

require: Object.create, Object.append

provides: Class

...
*/

var Class = window.Class = function(prototype, declaration){
	if( declaration == null ){
		declaration = prototype;
		prototype = Class.prototype;
	}
	if( !declaration.constructor ) declaration.constructor = function(){};
	if( prototype instanceof Function ) prototype = prototype.prototype;

	declaration.constructor.prototype = Object.create(prototype, {
		constructor: {
			configurable: true,
			enumerable: true,
			value: declaration.constructor,
			writable: true
		}
	});
	// add everything from the declaration onto the new prototype
	Object.append(declaration.constructor.prototype, declaration);

	return declaration.constructor;
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
	constructor: function(){
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
	constructor: function(){
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
