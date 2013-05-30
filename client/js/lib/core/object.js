/*

name: Object.cloning

description: Cloning an object

provides: Object.clone

maybe i could write a ObjectIterator class
and an ObjectPropertiesIterator class that could handle the subtility
of ignoreSpec that i need to pass to every function

*/

Object.get = function(object, key){
	return object[key];
};

Object.getClone = function(object, key){
	return Object.clone(Object.get(object, key), false, true);
};

Object.getOwnPropertyDescriptorValueCloned = function(object, key){
	var descriptor = Object.getOwnPropertyDescriptor(object, key);
	if( 'value' in descriptor ) descriptor.value = Object.clone(descriptor.value);
	return descriptor;
};

Object.setPair = function(key, value, object, ignoreSpec){
	if( ignoreSpec ) this[key] = value;
	else Object.defineProperty(this, key, value);
};

Object.iterate = function(object, fn, bind, ignoreSpec){
	Object[ignoreSpec ? 'keys' : 'getOwnPropertyNames'](object).forEach(function(key){
		fn.call(bind, key, object, ignoreSpec);
	});
};

Object.iteratePair = function(object, fn, bind, ignoreSpec){
	var get = ignoreSpec ? 'get' : 'getOwnPropertyDescriptor';

	Object.iterate(object, function(key, object, ignoreSpec){
		fn.call(bind, key, Object[get](object, key), object, ignoreSpec);
	}, bind, ignoreSpec);
};

Object.iterateClonePair = function(object, fn, bind, recursive, ignoreSpec){
	var get;

	if( ignoreSpec ){
		get = 'get';
		if( recursive ) get = 'getClone';
	}
	else{
		get = 'getOwnPropertyDescriptor';
		if( recursive ) get = 'getOwnPropertyDescriptorValueCloned';
	}

	Object.iterate(object, function(key, object, ignoreSpec){
		fn.call(bind, key, Object[get](object, key), object, ignoreSpec, recursive);
	}, bind, ignoreSpec);
};

Object.clone = function(object, recursive, ignoreSpec){
	var clone;

	if( typeof object == 'object' && object != null ){
		if( typeof object.clone == 'function' ){
			clone = object.clone();
		}
		else{
			clone = {};
			Object.iterateClonePair(object, Object.setPair, clone, recursive, ignoreSpec);
			if( !ignoreSpec ){
				if( !Object.isExtensible(object) ) Object.preventExtensions(clone);
				if( Object.isSealed(object) ) Object.seal(clone);
				if( Object.isFrozen(object) ) Object.freeze(clone);
			}
		}
	}
	else{
		clone = object;
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

Object.mergePair = function(key, value, object, ignoreSpec){
	if( typeof this[key] == 'object' && this[key] !== null ){
		Object.merge(this[key], object[key], ignoreSpec);
	}
	else{
		Object.setPair.apply(this, arguments);
	}
};

Object.merge = function(object, source, ignoreSpec){
	Object.iterateClonePair(source, Object.mergePair, object, true, ignoreSpec);
	return object;
};

Object.forEachArrayPair = function(array, fn, bind, ignoreSpec){
	var i = 0, j = array.length, item;

	for(;i<j;i++){
		item = array[i];
		if( item instanceof Function ){
			item = item.prototype;
		}
		if( typeof item == 'string' ){
			var obj = {};
			obj[item] = array[i++];
			item = obj;
		}

		if( typeof item == 'object' ){
			Object.iteratePair(item, fn, bind, ignoreSpec);
		}
	}

	return bind;
};

Object.append = function(object){
	return Object.forEachArrayPair(toArray(arguments, 1), Object.setPair, object);
};

// setPair in this if not already existing
Object.completePair = function(key){
	if( !(key in this) ) return Object.setPair.apply(this, arguments);
};

Object.complete = function(object){
	return Object.forEachArrayPair(toArray(arguments, 1), Object.completePair, object);
};

/*

name: Object.overload

description: Overloading properties of object

provides:
	Object.getInstance, Object.eachPair, Array.prototype.eachPair,
	Object.appendPair, Object.completePair, Object.mergePair,
	Object.appendThis, Object.completeThis, Object.mergeThis,
	Object.append, Object.complete, Object.merge

*/

Object.getInstance = function(fn){
	return new fn();
};

Object.eachPair = function(object, fn, bind){
	for(var name in object) fn.call(bind, name, object[name], object);
	return object;
};

/*

name: Object.util

description: Utilities over object

provides: Object.forEach, Object.map, Object.isEmpty, Object.keys, Object.values, Object.pairs

*/

Object.complete(Object, {
	forEach: function(object, fn, bind){
		for(var key in object){
			if( Object.prototype.hasOwnProperty.call(object, key) ) fn.call(bind, object[key], key, object);
		}
	},

	map: function(object, fn, bind){
		var results = {}, key;
		for(key in object){
			if( Object.prototype.hasOwnProperty.call(object, key) ) results[key] = fn.call(bind, object[key], key, object);
		}
		return results;
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
	Object.implementThis, Object.complementThis,
	String.implement, String.complement,
	Number.implement, Number.complement,
	Function.implement, Function.complement,
	Array.implement, Array.complement
	Function.prototype.implement, Function.prototype.complement
*/

Object.implementThis = function(){
	Object.forEachArrayPair(arguments, Object.mergePair, this.prototype);
	return this;
};

Object.complementThis = function(){
	Object.forEachArrayPair(arguments, Object.completePair, this.prototype);
	return this;
};

[String, Number, Function, Array].forEach(function(item){
	item.implement = Object.implementThis.bind(item);
	item.complement = Object.complementThis.bind(item);
});

Function.implement({
	implement: Object.implementThis,
	complement: Object.complementThis
});
