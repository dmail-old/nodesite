/*
---

name: Item

description: Function helping to create constructor Function

require: Object.create, Object.append

provides: Item

...
*/

/*

name: Implement

provides:
	Object.implement, Object.complement,
	String.implement, String.complement,
	Number.implement, Number.complement,
	Function.implement, Function.complement,
	Array.implement, Array.complement
	Function.prototype.implement, Function.prototype.complement
*/

var Item = window.Item = function(name){
	if( typeof name == 'string' ){
		if( name in Item.items ){
			name = Item.items[name];
		}
		else{
			console.trace();
			throw new Error('class ' + name + ' not found');
		}
	}
	return name;
};

Item.exists = function(name){
	return name in Item.items;
};

Item.proto = function(item){
	return Object.getPrototypeOf(item);
};

Item.is = function(name, object){
	return Item(name).isPrototypeOf(object);
};

// set key/value pair in this creating conflictual object and merging them
Item.implementPair = function(key, value){

	if( typeof value == 'object' && value !== null ){
		var current = this[key];
		if( typeof current == 'object' && current !== null ){
			current = this[key] = Object.create(current);
			Object.eachOwnPair(value, Item.implementPair, current);
		}
		else{
			Object.setPair.apply(this, arguments);
		}
	}
	else{
		Object.setPair.apply(this, arguments);
	}

	return this;
};

Item.implement = function(){
	Array.eachObject(arguments, 'eachPair', Item.implementPair, this);
};

Item.complement = function(){
	Array.eachObject(arguments, 'eachPair', Object.completePair, this);
};

[Object, String, Number, Function, Array].forEach(function(item){
	item.implement = Item.implement.bind(item.prototype);
	item.complement = Item.complement.bind(item.prototype);
});

Item.items = {};

// return object giving him name & implement properties, merged with arguments
Item.define = function(name, object){
	var i = 2, j = arguments.length, arg;

	if( j == 1 ){
		object = {};
	}
	else{
		for(;i<j;i++){
			arg = arguments[i];
			if( typeof arg == 'string' ) arg = Item(arg);
			Item.implement.call(object, arg);
		}
	}

	object.implement = Item.implement;

	//object.__name__ = name;
	Object.defineProperty(object, '__name__', {
		writable: true,
		ennumerable: false,
		value: name
	});

	this.items[name] = object;

	return object;
};

// Item.extend create an object starting from an instance of parent
Item.extend = function(parent, name){
	if( typeof parent == 'string' ){
		parent = Item(parent);
	}
	if( '__name__' in parent ){
		name = parent.__name__ + '.' + name;
	}

	return this.define.apply(this, [name, Object.create(parent)].concat(toArray(arguments, 2)));
};

// return an instance of object calling it's constructor
Item.new = function(object){
	if( typeof object == 'string' ){
		object = Item(object);
	}

	var instance = Object.create(object);

	if( 'constructor' in instance ) instance.constructor.apply(instance, toArray(arguments, 1));

	return instance;
};

Item.define('options', {
	setOptions: function(options){

		// only if this has not yet an options object
		if( !this.hasOwnProperty('options') ){
			// create object derived from parent options
			if( 'options' in this ){
				this.options = Object.copy(this.options);
			}
			else{
				this.options = {};
			}
		}

		if( options ){
			Object.merge(this.options, options);
		}

		return this;
	}
});

Item.define('chain', {
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
});

Item.define('bound', {
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
});
