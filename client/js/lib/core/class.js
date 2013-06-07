/*
---

name: Class

description: Function helping to create constructor Function

require: Object.create, Object.append

provides: Class

...
*/

var Class = window.Class = function(parent){	
	if( typeof parent == 'string' ){
		if( parent in Class.constructors ){
			parent = Class.constructors[parent];
		}
		else{
			console.trace();
			throw new Error('class ' + parent + ' not found');
		}			
	}
	return parent;
};

Class.constructors = {};

Class.create = function(parent){
	var i = 1, j = arguments.length, proto, constructor;

	proto = Object.copy(parent instanceof Function ? parent.prototype : parent);

	for(;i<j;i++){
		Object.merge(proto, arguments[i]);
	}

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
	constructor.prototype = proto;
	constructor.prototype.constructor = constructor;

	return constructor;
};

Class.extend = function(){
	var parent, name, constructor, i;

	if( typeof arguments[1] != 'string' ){
		parent = Class;
		name = arguments[0];
		i = 1;
	}
	else{
		parent = arguments[0];
		name = arguments[1];
		i = 2;
	}

	if( typeof parent == 'string' ){
		parent = Class(parent);
	}
	if( typeof parent == 'undefined'){
		throw new Error('must provide a parent class');
	}
	if( typeof parent != 'function' ){
		throw new Error('parent class must be a constructor');
	}

	constructor = Class.create.apply(this, [parent].concat(toArray(arguments, i)));

	if( parent.$path ){
		constructor.$path = parent.$path + '.' + name;
	}
	else{
		constructor.$path = name;
	}
	
	this.constructors[constructor.$path] = constructor;

	return constructor;
};

Class.construct = function(constructor, args){
	return constructor.apply(this, args);
};

Class.applyConstructor = function(constructor, args){
	this.construct.prototype = constructor.prototype;
	return new this.construct(constructor, args);
};

Class.new = function(path){
	return Class.applyConstructor(Class(path), toArray(arguments, 1));
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
