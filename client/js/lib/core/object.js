/*

name: Object.overload

description: Overloading properties of object

provides:
	Object.ownKeys, Object.eachPair, Object.eachOwnPair, Array.eachOwnpair,
	Object.setPair, Object.setPairClone, Object.completePair, Object.mergePair,
	Object.append, Object.complete, Object.clone, Object.merge, Object.copy
*/

Object.ownKeys = Object.keys;

Object.eachPair = function(object, fn, bind){
	for(var key in object) fn.call(bind, key, object[key], object);
	return object;
};

Object.eachOwnPair = function(object, fn, bind){
	var keys = Object.ownKeys(object), i = 0, j = keys.length, key;
	for(;i<j;i++){
		key = keys[i];
		fn.call(bind, key, object[key], object);
	}
	return object;
};

Array.eachObject = function(array, method, fn, bind){
	var i = 0, j = array.length, item;

	for(;i<j;i++){
		item = array[i];
		if( item instanceof Function ) item = item.prototype;

		switch(typeof item){
		case 'string':
			fn.call(bind, item, array[++i]);
			break;
		case 'object':
			Object[method](item, fn, bind);
			break;
		}
	}
};

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

Object.append = function(object){
	Array.eachObject(toArray(arguments, 1), 'eachOwnPair', Object.setPair, object);
	return object;
};

Object.complete = function(object){
	Array.eachObject(toArray(arguments, 1), 'eachOwnPair', Object.completePair, object);
	return object;
};

Object.merge = function(object){
	Array.eachObject(toArray(arguments, 1), 'eachOwnPair', Object.mergePair, object);
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

	Object.eachPair = function(object, fn, bind){
		var names = Object.getOwnPropertyNames(object), name, i, j, parentNames;

		i = 0;
		j = names.length;
		for(;i<j;i++){
			name = names[i];
			fn.call(bind, name, object[name], object);
		}

		while( object = Object.getPrototypeOf(object) ){
			if( object == Object.prototype ) break;
			parentNames = Object.getOwnPropertyNames(object);
			i = 0;
			j = parentNames.length;
			for(;i<j;i++){
				name = parentNames[i];
				if( names.indexOf(name) === -1 ){
					names.push(name);
					fn.call(bind, name, object[name], object);
				}
			}
		}
	};

	/*
	Object.getPropertyOwner = function(object, key){
		while( object ){
			if( Object.prototype.hasOwnProperty.call(object, key) ) return object;
			object = Object.getPrototypeOf(object);
		}
		return null;
	};

	Object.getPropertyDescriptor = function(object, key){
		object = Object.getPropertyOwner(object, key);
		return object ? Object.getOwnPropertyDescriptor(object, key) : null;
	};
	*/
}

/*

name: Object.util

description: Utilities over object

provides: Object.forEach, Object.isEmpty, Object.keys, Object.values, Object.pairs

*/

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

*/

Object.implement = function(){
	Array.eachObject(arguments, 'eachPair', Object.mergePair, this.prototype);
};

Object.complement = function(){
	Array.eachObject(arguments, 'eachPair', Object.completePair, this.prototype);
};

[String, Number, Function, Array].forEach(function(constructor){
	constructor.implement = Object.implement.bind(constructor);
	constructor.complement = Object.complement.bind(constructor);
});
