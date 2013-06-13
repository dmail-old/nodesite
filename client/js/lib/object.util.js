/*

name: Object.cloning

provides:
	Object.setPairClone, Object.clone, Object.mergePair, Object.merge,
	RegExp.prototype.clone, Date.prototype.clone, Array.prototype.clone

*/

if( 'getOwnPropertyDescriptor' in Object ){

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

}
else{

	Object.setPairClone = function(key, value){
		this[key] = Object.clone(value);
	};

}

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

Object.merge = function(object){
	Object.eachObjectIn(toArray(arguments, 1), 'eachOwnPair', Object.mergePair, object);
	return object;
};

RegExp.prototype.clone = Function.THIS;
Date.prototype.clone = Function.THIS;
Array.prototype.clone = function(){
	var i = this.length, clone = new Array(i);

	while(i--) clone[i] = Object.clone(this[i]);

	return clone;
};

/*

name: Object.util

description: Utilities over object

requires: Object.complete

provides:  Object.forEach, Object.isEmpty, Object.keys, Object.values, Object.pairs

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
