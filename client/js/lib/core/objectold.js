/*

name: Object.cloning

description: Cloning an object

provides: Object.clone, Object.cloneOf

*/

(function(){

Object.getClone = function(object, key){
	var descriptor = Object.getOwnPropertyDescriptor(object, key);
	if( 'value' in descriptor ) descriptor.value = Object.clone(descriptor.value);
	return descriptor;
};

Object.clone = function(object){
	var clone = object;
	
	if( typeof object == 'object' && object != null ){
		if( typeof object.clone == 'function' ) clone = object.clone();
		else{
			clone = {};
			Object.getOwnPropertyNames(object).forEach(function(key){
				Object.defineProperty(clone, key, Object.getClone(object, key));
			});
			
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

})();

/*

name: Object.overload

description: Overloading properties of object

provides:
	Object.getInstance, Object.eachPair, Array.prototype.eachPair, 
	Object.appendPair, Object.completePair, Object.mergePair,
	Object.appendThis, Object.completeThis, Object.mergeThis,
	Object.append, Object.complete, Object.merge

*/

(function(){

Object.eachPair = function(source, fn, bind){
	for(var name in source) fn.call(bind, name, source[name], source);
	return source;
};

Object.eachOwnPair = function(source, fn, bind){
	Object.getOwnPropertyNames(source).forEach(function(key){
		fn.call(bind, key, source[key], source);
	});
	return source;
};

// call fn on every pair of this array
Array.prototype.eachPair = function(fn, bind){
	var i = 0, j = this.length, item, name;
	
	for(;i<j;i++){
		item = this[i];
		if( item instanceof Function ) item = item.prototype;
		if( typeof item == 'string' ){
			var temp  ={};
			temp[item] = this[++i];
			item = temp;
		}
		
		switch(typeof item){
			case 'object': Object.eachPair(item, fn, bind); break;
		}
	}
	
	return this;
};

// append key.value pair to this
Object.appendPair = function(key, value, object){
	Object.defineProperty(this, key, Object.getOwnPropertyDescriptor(object, key));
	
	//this[key] = value;
	
	return this;
};

// append key/valuepair to this if not present
Object.completePair = function(key, value){
	if( !(key in this) ) this[key] = value;
	
	return this;
};

// append key/value pair but clone objets (array,regexp,date,...) and merge object when they already exists in source
Object.mergePair = function(key, value, object){
	var current;
	
	if( typeof value == 'object' && value != null ){
		current = this[key];
		if( typeof current == 'object' ){
			Object.eachOwnPair(value, Object.mergePair, current);
		}
		else{
			Object.defineProperty(this, key, Object.getClone(object, key));
		}
	}
	else{
		Object.defineProperty(this, key, Object.getOwnPropertyDescriptor(object, key));
	}
	
	return this;
};

Object.appendThis = function(){
	Array.prototype.eachPair.call(arguments, Object.appendPair, this);
	return this;
};

Object.completeThis = function(){
	Array.prototype.eachPair.call(arguments, Object.completePair, this);
	return this;
};

Object.mergeThis = function(){
	Array.prototype.eachPair.call(arguments, Object.mergePair, this);
	return this;
};

Object.append = function(source){
	return Object.appendThis.apply(source, toArray(arguments, 1));
};

Object.complete = function(source){
	return Object.completeThis.apply(source, toArray(arguments, 1));
};

Object.merge = function(source){
	return Object.mergeThis.apply(source, toArray(arguments, 1));
};

}).call(window);

/*

name: Object.util

description: Utilities over object

provides: Object.forEach, Object.each, Object.isEmpty, Object.keys, Object.values, Object.pairs

*/

(function(){

var hasOwnProperty = Object.prototype.hasOwnProperty;
	
Object.complete(Object, {
	forEach: function(object, fn, bind){
		for(var key in object){
			if( hasOwnProperty.call(object, key) ) fn.call(bind, object[key], key, object);
		}
	},
	
	isEmpty: function(object){
		for(var key in object){
			if( hasOwnProperty.call(object, key) ) return false;
		}
		return true;
	},
	
	keys: function(object){
		var key, keys = [];
		for(key in object){
			if( hasOwnProperty.call(object, key) ) keys.push(key);
		}
		return keys;
	},

	values: function(object){
		var key, values = [];
		for(key in object){
			if( hasOwnProperty.call(object, key) ) values.push(object[key]);
		}
		return values;
	},
	
	pairs: function(object){
		var key, keys = [], values = [];
		for(key in object){
			if( hasOwnProperty.call(object, key) ){
				keys.push(key);
				values.push(object[key]);
			}
		}
		return [keys, values];
	}
});

Object.each = Object.forEach;

})();


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

(function(){

Object.implementThis = function(){
	Array.prototype.eachPair.call(arguments, Object.mergePair, this.prototype);
	return this;
};

Object.complementThis = function(){
	Array.prototype.eachPair.call(arguments, Object.completePair, this.prototype);
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

})();