// FIX: when adding this file 6000call onload, when adding objectold, wich has almost the same effect 2000call onload

/*

name: Object.cloning

description: Cloning an object

provides: Object.clone

*/

Object.iterator = {	
	merge: function(key, value, source){
		if( typeof this[key] == 'object' && this[key] !== null ){
			Object.merge(this[key], source[key]);
		}
		else{
			Object.iterator.set.apply(this, arguments);
		}
	},
	
	complete: function(key){
		if( !(key in this) ) Object.iterator.set.apply(this, arguments);
	},
	
	forEach: function(object, fn, bind){		
		this.list(object).forEach(function(key){ fn.call(bind, key, object); });
	},
	
	forEachWithValue: function(object, fn, bind, getter, getterBind){		
		this.list(object).forEach(function(key){ fn.call(bind, key, getter.call(getterBind, object, key), object); }, this);
	},
	
	forEachPair: function(object, fn, bind){
		return this.forEachWithValue(object, fn, bind, this.get, this);
	},
	
	forEachPairCloned: function(object, fn, bind){
		return this.forEachWithValue(object, fn, bind, this.getClone, this);
	},
		
	iterateArray: function(array, fn, bind, iterator, iteratorBind){
		var i = 0, j = array.length, object, temp;

		for(;i<j;i++){
			object = array[i];
			if( object instanceof Function ){
				object = object.prototype;
			}
			if( typeof object == 'string' ){
				temp = {};
				temp[object] = array[++i];
				object = temp;
			}

			if( typeof object == 'object' ){
				iterator.call(iteratorBind, object, fn, bind);
			}
		}
	},
	
	iterateArrayPair: function(array, fn, bind){
		this.iterateArray(array, fn, bind, this.forEachPair, this);
	},
	
	iterateArrayPairCloned: function(array, fn, bind){
		this.iterateArray(array, fn, bind, this.forEachPairCloned, this);
	}
};

Object.clone = function(object, recursive){
	var clone;

	if( typeof object == 'object' && object != null ){
		if( typeof object.clone == 'function' ){
			clone = object.clone();
		}
		else{
			clone = {};
			Object.iterator[recursive ? 'forEachPairCloned' : 'forEachPair'](object, Object.iterator.set, clone);		
			
			// only if es5
			if( !Object.isExtensible(object) ) Object.preventExtensions(clone);
			if( Object.isSealed(object) ) Object.seal(clone);
			if( Object.isFrozen(object) ) Object.freeze(clone);
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

Object.merge = function(object){
	Object.iterator.iterateArrayPairCloned(toArray(arguments, 1), Object.iterator.merge, object);
	return object;
};

Object.append = function(object){
	Object.iterator.iterateArrayPair(toArray(arguments, 1), Object.iterator.set, object);
	return object;
};

Object.complete = function(object){
	Object.iterator.iterateArrayPair(toArray(arguments, 1), Object.iterator.complete, object);
	return object;
};

if( false && 'getOwnPropertyNames' in Object ){
	Object.iterator.list = function(object){
		return Object.getOwnPropertyNames(object);
	};
	Object.iterator.get = function(object, key){
		return Object.getOwnPropertyDescriptor(object, key);
	};
	Object.iterator.getClone = function(object, key){
		var descriptor = this.get(object, key);
		if( 'value' in descriptor ) descriptor.value = Object.clone(descriptor.value);
		return descriptor;
	};	
	Object.iterator.set = function(key, value){
		Object.defineProperty(this, key, value);
	};
}
else{
	Object.iterator.list = function(object){
		return Object.keys(object);
	};
	Object.iterator.get = function(object, key){
		return object[key];
	};	
	Object.iterator.getClone = function(object, key){
		return Object.clone(this.get(object, key));
	};	
	Object.iterator.set = function(key, value){
		this[key] = value;
	};
}

/*

name: Object.overload

description: Overloading properties of object

provides:
	Object.eachPair

*/


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
	Object.implement, Object.complement,
	String.implement, String.complement,
	Number.implement, Number.complement,
	Function.implement, Function.complement,
	Array.implement, Array.complement
	Function.prototype.implement, Function.prototype.complement
*/

Object.implement = function(){
	Object.iterator.iterateArrayPairCloned(arguments, Object.iterator.merge, this.prototype);
	return this;
};

Object.complement = function(){
	Object.iterator.iterateArrayPairCloned(arguments, Object.iterator.complete, this.prototype);
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
