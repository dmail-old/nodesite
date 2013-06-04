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
	var constructor;

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

	constructor = proto.constructor;

	constructor.prototype = Object.copy(parent instanceof Function ? parent.prototype : parent);
	constructor.prototype.constructor = constructor;

	if( 'Implements' in proto ){
		var items = proto.Implements;
		if( !(items instanceof Array) ) constructor.implement(items);
		else constructor.implement.apply(constructor, items);
	}

	constructor.implement(proto);

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
