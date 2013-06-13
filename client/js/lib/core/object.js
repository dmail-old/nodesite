/*

name: Object

description: required almost everywhere

provides:
	Object.eachOwnPair, Object.eachObjectIn,
	Object.setPair, Object.append,
	Object.completePair, Object.complete

*/

if( 'getOwnPropertyNames' in Object ){

	Object.ownKeys = Object.getOwnPropertyNames;

}
else{

	Object.ownKeys = Object.keys;

}

if( 'getOwnPropertyDescriptor' in Object ){

	Object.setPair = function(key, value, object){
		if( object ){
			Object.defineProperty(this, key, Object.getOwnPropertyDescriptor(object, key));
		}
		else{
			this[key] = value;
		}
	};

}
else{

	Object.setPair = function(key, value, object){
		this[key] = value;
	};

}

// set key/value pair in this if not existing
Object.completePair = function(key){
	if( !(key in this) ) Object.setPair.apply(this, arguments);
};

Object.eachOwnPair = function(object, fn, bind){
	var keys = Object.ownKeys(object), i = 0, j = keys.length, key;
	for(;i<j;i++){
		key = keys[i];
		fn.call(bind, key, object[key], object);
	}
	return object;
};

Object.eachObjectIn = function(array, method, fn, bind){
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

Object.append = function(object){
	Object.eachObjectIn(toArray(arguments, 1), 'eachOwnPair', Object.setPair, object);
	return object;
};

Object.complete = function(object){
	Object.eachObjectIn(toArray(arguments, 1), 'eachOwnPair', Object.completePair, object);
	return object;
};

/*

name: Implement/Complement

requires: Object.eachObjectIn, Object.mergePair, Object.completePair

provides: Object.eachPair, Object.implement, Object.complement

*/

if( 'getOwnPropertyNames' in Object ){

	Object.eachPair = function(object, fn, bind){
		var names = Object.getOwnPropertyNames(object), name, i, j, parentNames;

		if( !fn ) console.trace();

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
else{

	Object.eachPair = function(object, fn, bind){
		for(var key in object) fn.call(bind, key, object[key], object);
		return object;
	};

}

Object.implement = function(){
	Object.eachObjectIn(arguments, 'eachPair', Object.setPair, this.prototype);
};

Object.complement = function(){
	Object.eachObjectIn(arguments, 'eachPair', Object.completePair, this.prototype);
};
