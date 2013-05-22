/*

name: Object.cloning

description: Cloning an object

provides: Object.clone, Object.cloneOf

*/

Object.cloneOf = function(source){
	if( typeof source == 'object' && source != null ){
		if( typeof source.clone == 'function' ) source = source.clone();
		else source = Object.clone(source);
	}

	return source;
};

Object.clone = function(source){
	var clone = {}, key;

	for(key in source) clone[key] = Object.cloneOf(source[key]);

	return clone;
};

RegExp.prototype.clone = Function.THIS;
Date.prototype.clone = Function.THIS;
Array.prototype.clone = function(){
	var i = this.length, clone = new Array(i);

	while(i--) clone[i] = Object.cloneOf(this[i]);

	return clone;
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

Object.eachPair = function(source, fn, bind){
	for(var name in source) fn.call(bind, name, source[name]);
	return source;
};

// call fn on every pair of this array
Array.prototype.eachPair = function(fn, bind){
	var i = 0, j = this.length, item, name;

	for(;i<j;i++){
		item = this[i];
		if( item instanceof Function ) item = Object.getInstance(item);

		switch(typeof item){
		case 'string':
			fn.call(bind, item, this[i+1]);
			i++;
			break;
		case 'object':
			Object.eachPair(item, fn, bind);
			break;
		}
	}

	return this;
};

// append key.value pair to this
Object.appendPair = function appendPair(key, value){
	this[key] = value;

	return this;
};

// append key/valuepair to this if not present
Object.completePair = function(key, value){
	if( !(key in this) ) this[key] = value;

	return this;
};

// append key/value pair but clone objets (array,regexp,date,...) and merge object when they already exists in source
Object.mergePair = function(key, value){
	var current;

	if( typeof value == 'object' && value != null ){
		current = this[key];
		if( typeof current == 'object' ){
			for(key in value){
				Object.mergePair.call(current, key, value[key]);
			}
		}
		else{
			this[key] = Object.cloneOf(value);
		}
	}
	else{
		this[key] = value;
	}

	return this;
};

Object.deletePair = function(key){
	delete this[key];
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
