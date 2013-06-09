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
		if( name in Item.constructors ){
			name = Item.constructors[name];
		}
		else{
			console.trace();
			throw new Error('class ' + name + ' not found');
		}			
	}
	return name;
};

Item.exists = function(name){
	return name in Item.constructors;
};

Item.is = function(name, object){
	return '__name__' in object && object.__name__ === name;
};

Item.implement = function(){
	Array.eachObject(arguments, 'eachPair', Object.mergePair, this);
};

Item.complement = function(){
	Array.eachObject(arguments, 'eachPair', Object.completePair, this);
};

[Object, String, Number, Function, Array].forEach(function(item){
	item.implement = Item.implement.bind(item.prototype);
	item.complement = Item.complement.bind(item.prototype);
});

Item.constructors = {};

// return constructor merged with arguments and giving him the name name
Item.define = function(name, constructor){
	constructor.implement = Item.implement;

	var i = 2, j = arguments.length, arg;
	for(;i<j;i++){
		arg = arguments[i];
		if( typeof arg == 'string' ) arg = Item(arg);
		constructor.implement(arg);
	}

	//constructor.__name__ = name;
	Object.defineProperty(constructor, '__name__', {
		writable: true,
		ennumerable: false,
		value: name
	});

	this.constructors[name] = constructor;

	return constructor;
};

// Item.extend suggest the Item inerits from an instance of the first argument 
Item.extend = function(parent, name){
	if( typeof parent == 'string' ){
		parent = Item(parent);
	}
	if( '__name__' in parent ){
		name = parent.__name__ + '.' + name;
	} 

	var object = this.define.apply(this, [name, Object.copy(parent)].concat(toArray(arguments, 2)));
	return object;
};

// Item.create suggest the Item inerits from Object.prototype
Item.create = function(name){
	return this.extend.apply(this, [Object.prototype].concat(toArray(arguments)));
};

Item.new = function(path){
	var object = Item(path);
	var instance = Object.create(object);
	if( 'constructor' in instance ) instance.constructor.apply(instance, toArray(arguments, 1));
	return instance;
};

Item.define('options', {
	setOptions: function(clientOptions){
		var options = {};

		if( 'options' in this ){
			Object.merge(options, this.options);
		}
		if( clientOptions ){
			Object.merge(options, clientOptions);
		}

		this.options = options;

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
