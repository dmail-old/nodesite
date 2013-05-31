/*

name: Object.overload

description: Overloading properties of object

provides:
	Object.setPair, Object.setPairClone, Object.completePair, Object.mergePair,
	Object.eachPair, Object.eachArraypair,
	Object.append, Object.complete, Object.clone, Object.merge
*/

// set key value pair in this
Object.setPair = function(key, value, object){
	this[key] = value;
};

// set key value pair but cloning the value
Object.setPairClone = function(key, value){
	this[key] = Object.clone(value);
};

// set key/valuepair to this if not existing
Object.completePair = function(key){
	if( !(key in this) ) Object.setPair.apply(this, arguments);
};

// set key/value pair but clone objets (array,regexp,date,...) and
// merge object when they already existse
Object.mergePair = function(key, value){
	if( typeof value == 'object' && value !== null ){
		if( typeof this[key] == 'object' ){
			Object.eachPair(value, Object.mergePair, this[key]);
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

Object.eachPair = function(object, fn, bind){
	for(var key in object) fn.call(bind, key, object[key], object);
	return object;
};

Object.eachArrayPair = function(array, fn, bind){
	var i = 0, j = array.length, item, name;

	for(;i<j;i++){
		item = array[i];
		if( item instanceof Function ) item = item.prototype;

		switch(typeof item){
		case 'string':
			fn.call(bind, item, array[++i]);
			break;
		case 'object':
			Object.eachPair(item, fn, bind);
			break;
		}
	}
};

Object.append = function(object){
	Object.eachArrayPair(toArray(arguments, 1), Object.setPair, object);
	return object;
};

Object.complete = function(object){
	Object.eachArrayPair(toArray(arguments, 1), Object.completePair, object);
	return object;
};

Object.clone = function(object){
	var clone = object;

	if( typeof object == 'object' && object != null ){
		if( typeof object.clone == 'function' ) clone = object.clone();
		else{
			clone = {};
			Object.eachPair(object, Object.setPairClone, clone);

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
	Object.eachArrayPair(toArray(arguments, 1), Object.mergePair, object);
	return object;
};

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

	Object.eachPair = function(object, fn, bind){
		Object.getOwnPropertyNames(object).forEach(function(key){
			fn.call(bind, key, object[key], object);
		});
		return object;
	};
}

/*

name: Object.util

description: Utilities over object

provides: Object.forEach, Object.each, Object.isEmpty, Object.keys, Object.values, Object.pairs

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
	Object.implementThis, Object.complementThis,
	String.implement, String.complement,
	Number.implement, Number.complement,
	Function.implement, Function.complement,
	Array.implement, Array.complement
	Function.prototype.implement, Function.prototype.complement
*/

Object.implement = function(){
	Object.eachArrayPair(arguments, Object.mergePair, this.prototype);
	return this;
};

Object.complement = function(){
	Object.eachArrayPair(arguments, Object.completePair, this.prototype);
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
