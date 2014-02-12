/*

name: Object

description: required almost everywhere

provides:
	Object.eachObjectIn, Object.ownKeys, Object.eachOwnPair,
	Object.appendPair, Object.append,
	Object.completePair, Object.complete
	Object.implementPair, Object.implement,
	Object.complementPair, Object.complement

*/

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

if( 'getOwnPropertyNames' in Object ){
	Object.ownKeys = Object.getOwnPropertyNames;
}
else{
	Object.ownKeys = Object.keys;
}

Object.eachOwnPair = function(object, fn, bind){
	var keys = Object.ownKeys(object), i = 0, j = keys.length, key;
	for(;i<j;i++){
		key = keys[i];
		fn.call(bind, key, object[key], object);
	}
	return object;
};

if( 'getOwnPropertyDescriptor' in Object ){

	Object.appendPair = function(key, value, object){
		if( object ){
			Object.defineProperty(this, key, Object.getOwnPropertyDescriptor(object, key));
		}
		else{
			this[key] = value;
		}
	};

}
else{

	Object.appendPair = function(key, value, object){
		this[key] = value;
	};

}

Object.append = function(object){
	Object.eachObjectIn(Array.prototype.slice.call(arguments, 1), 'eachOwnPair', Object.appendPair, object);
	return object;
};

// set key/value pair in this if not existing
Object.completePair = function(key){
	if( !(key in this) ) Object.appendPair.apply(this, arguments);
};

Object.complete = function(object){
	Object.eachObjectIn(Array.prototype.slice.call(arguments, 1), 'eachOwnPair', Object.completePair, object);
	return object;
};

Object.implementPair = function(key, value, object){
	var descriptor;

	if( object ){
		descriptor = Object.getOwnPropertyDescriptor(object, key);
		descriptor.enumerable = false;
	}
	else{
		descriptor = {enumerable: false,  configurable: true, writable: true, value: value};
	}

	Object.defineProperty(this, key, descriptor);
};

Object.implement = function(){
	Object.eachObjectIn(arguments, 'eachOwnPair', Object.implementPair, this.prototype);
};

Object.complementPair = function(key, value){
	if( !(key in this) ) Object.implementPair.apply(this, arguments);
};

Object.complement = function(){
	Object.eachObjectIn(arguments, 'eachOwnPair', Object.complementPair, this.prototype);
};

/*

Object.eachPair

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

/*

Object.instance

provides:
	Object.prototytpe.supplement, Object.prototype.extend,
	Object.prototype.new, Object.prototype.getPrototype

*/

Object.implement({
	supplement: function(){
		Object.eachObjectIn(arguments, 'eachPair', Object.appendPair, this);
		return this;
	},

	extend: function(){
		var object = Object.create(this);

		object.supplement.apply(object, arguments);

		return object;
	},

	// return an instance of this object calling it's create method
	new: function(){
		var instance = Object.create(this), create = instance.create;

		if( typeof create == "function" ) create.apply(instance, arguments);

		return instance;
	},

	getPrototype: function(){
		return Object.getPrototypeOf(this);
	}
});

if( !Object.create ){
	Object.create = function(object){
		var F = function(){};
		F.prototype = object;
		return new F();
	};
}
