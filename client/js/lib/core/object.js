/*

name: Object.overload

description: Overloading properties of object

provides:
	Object.setPair, Object.setPairClone, Object.completePair, Object.mergePair,
	Object.eachOwnPair, Array.eachOwnpair,
	Object.append, Object.complete, Object.clone, Object.merge, Object.copy
*/

// set key/value pair in this
Object.setPair = function(key, value, object){
	this[key] = value;
};

// set key/value pair in this cloning the value
Object.setPairClone = function(key, value){
	this[key] = Object.clone(value);
};

// set key/value pair in this if not existing
Object.completePair = function(key){
	if( !(key in this) ) Object.setPair.apply(this, arguments);
};

// set key/value pair in this cloning value and merging objects
Object.mergePair = function(key, value){
	if( typeof value == 'object' && value !== null ){
		var current = this[key];

		if( typeof current == 'object' && current !== null ){
			Object.eachOwnPair(value, Object.mergePair, current);
		}
		else{
			Object.setPairClone.apply(this, arguments);
		}
	}
	else{
		Object.setPair.apply(this, arguments);
	}

	return this;
};

Object.ownKeys = Object.keys;

Object.eachOwnPair = function(object, fn, bind){
	var keys = Object.ownKeys(object), i = 0, j = keys.length, key;
	for(;i<j;i++){
		key = keys[i];
		fn.call(bind, key, object[key], object);
	}
	return object;
};

Array.eachOwnpair = function(array, fn, bind){
	var i = 0, j = array.length, item, name;

	for(;i<j;i++){
		item = array[i];
		if( item instanceof Function ) item = item.prototype;

		switch(typeof item){
		case 'string':
			fn.call(bind, item, array[++i]);
			break;
		case 'object':
			Object.eachOwnPair(item, fn, bind);
			break;
		}
	}
};

Object.append = function(object){
	Array.eachOwnpair(toArray(arguments, 1), Object.setPair, object);
	return object;
};

Object.complete = function(object){
	Array.eachOwnpair(toArray(arguments, 1), Object.completePair, object);
	return object;
};

Object.clone = function(object){
	var clone = object;

	if( typeof object == 'object' && object != null ){
		if( typeof object.clone == 'function' ) clone = object.clone();
		else{
			clone = {};
			Object.eachOwnPair(object, Object.setPairClone, clone);

			// only if es5
			if( !Object.isExtensible(object) ) Object.preventExtensions(clone);
			if( Object.isSealed(object) ) Object.seal(clone);
			if( Object.isFrozen(object) ) Object.freeze(clone);
		}
	}

	return clone;
};

RegExp.prototype.clone = Function.THIS;
Date.prototype.clone = Function.THIS;
Array.prototype.clone = function(){
	var i = this.length, clone = new Array(i);

	while(i--) clone[i] = Object.clone(this[i]);

	return clone;
};

Object.merge = function(object){
	Array.eachOwnpair(toArray(arguments, 1), Object.mergePair, object);
	return object;
};

// create a deep copy of object still linked to every object or subobject by prototype
Object.copy = function(object){
	// Object.create return a copy of the object passed still linked to object by prototype
	// Consequently modifying object impacts the copy

	var copy = Object.create(object), key, value;

	for(key in copy){
		value = copy[key];
		if( typeof value == 'object' && value !== null ) copy[key] = Object.copy(value);
	}

	return copy;
};

if( !Object.create ){
	Object.create = function(object){
		var F = function(){};
		F.prototype = object;
		return new F();
	};
}

if( 'getOwnPropertyNames' in Object ){
	Object.setPair = function(key, value, object){
		if( object ){
			Object.defineProperty(this, key, Object.getOwnPropertyDescriptor(object, key));
		}
		else{
			this[key] = value;
		}
	};

	Object.setPairClone = function(key, value, object){
		if( object ){
			var descriptor = Object.getOwnPropertyDescriptor(object, key);
			if( 'value' in descriptor ) descriptor.value = Object.clone(descriptor.value);
			Object.defineProperty(this, key, descriptor);
		}
		else{
			this[key] = Object.clone(value);
		}
	};

	Object.ownKeys = Object.getOwnPropertyNames;
}

/*

name: Object.util

description: Utilities over object

provides: Object.eachPair, Object.forEach, Object.isEmpty, Object.keys, Object.values, Object.pairs

*/

Object.eachPair = function(object, fn, bind){
	for(var key in object) fn.call(bind, key, object[key], object);
	return object;
};

Object.complete(Object, {
	forEach: function(object, fn, bind){
		for(var key in object){
			if( Object.prototype.hasOwnProperty.call(object, key) ) fn.call(bind, object[key], key, object);
		}
	},

	isEmpty: function(object){
		for(var key in object){
			if( Object.prototype.hasOwnProperty.call(object, key) ) return false;
		}
		return true;
	},

	keys: function(object){
		var key, keys = [];
		for(key in object){
			if( Object.prototype.hasOwnProperty.call(object, key) ) keys.push(key);
		}
		return keys;
	},

	values: function(object){
		var key, values = [];
		for(key in object){
			if( Object.prototype.hasOwnProperty.call(object, key) ) values.push(object[key]);
		}
		return values;
	},

	pairs: function(object){
		var key, keys = [], values = [];
		for(key in object){
			if( Object.prototype.hasOwnProperty.call(object, key) ){
				keys.push(key);
				values.push(object[key]);
			}
		}
		return [keys, values];
	}
});

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

Object.implement = function(){
	Array.eachOwnpair(arguments, Object.mergePair, this.prototype);
	return this;
};

Object.complement = function(){
	Array.eachOwnpair(arguments, Object.completePair, this.prototype);
	return this;
};

[String, Number, Function, Array].forEach(function(item){
	item.implement = Object.implement.bind(item);
	item.complement = Object.complement.bind(item);
});

Function.implement({
	implement: Object.implement,
	complement: Object.complement
});


/*

name: Object.Proto

description: Prototype manipulation as merging, setting, getting prototype

provides: Object.create, Object.copy, Object.getPrototype, Object.setPrototype, Object.findPrototype, Object.findParentPrototype


*/

/*

useless for now

var getPrototype;

if( typeof Object.getPrototypeOf == 'function' ) getPrototype = Object.getPrototypeOf;
else if( typeof 'test'.__proto__ === 'object' ) getPrototype = function(instance){ return instance.__proto__; };
// May break if the constructor has been tampered with
else getPrototype = function(instance){ return instance.constructor.prototype; };

// get constructor prototype from instance
Object.getPrototype = getPrototype;

// find first prototype defining key
Object.findPrototype = function(instance, key){
	var proto = Object.getPrototype(instance);

	while( proto ){
		if( key in proto ) return proto;
		proto = Object.getPrototype(proto);
	}

	return null;
};

// find first parent prototype defining a key
Object.findParentPrototype = function(instance, key){
	var proto = Object.findPrototype(Object.getPrototype(instance), key);

	return proto ? proto[key] : null;
};

*/
