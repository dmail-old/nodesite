/*

*/

function cloneKeys(object, clone){
	var keys = Object.getOwnPropertyNames(object), i = 0, j = keys.length, key;

	for(;i<j;i++){
		key = keys[i];
		
		var descriptor = Object.getOwnPropertyDescriptor(object, key);
		if( 'value' in descriptor ) descriptor.value = util.clone(descriptor.value);
		Object.defineProperty(clone, key, descriptor);
	}

	return object;
}

function eachKey(object, fn, bind){
	var names = Object.getOwnPropertyNames(object), name, i, j, parentNames;

	i = 0;
	j = names.length;
	for(;i<j;i++){
		name = names[i];
		fn.call(bind, name, object);
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
				fn.call(bind, name, object);
			}
		}
	}
}

function appendKey(key, object){
	if( object ){
		var descriptor = Object.getOwnPropertyDescriptor(object, key);
		// not needed as we want the same descriptor as source
		//descriptor = module.exports.cloneDescriptor(descriptor);
		Object.defineProperty(this, key, descriptor);
	}
	else{
		this[key] = object[key];
	}
}

var util = {
	new: function(object){
		var instance = Object.create(object);
		if( typeof instance.init == 'function' ){
			instance.init.apply(this, Array.prototype.slice.call(arguments, 1));
		}
		return instance;
	},

	extend: function(parent, child){
		var instance = Object.create(parent);

		eachKey(child, appendKey, instance);

		return instance;
	},

	clone: function(object){
		var clone = object;

		if( typeof object == 'object' && object != null ){
			if( typeof object.clone == 'function' ) clone = object.clone();
			else{
				clone = {};
				cloneKeys(object, clone);

				// only if es5
				if( !Object.isExtensible(object) ) Object.preventExtensions(clone);
				if( Object.isSealed(object) ) Object.seal(clone);
				if( Object.isFrozen(object) ) Object.freeze(clone);
			}
		}

		return clone;
	}
};

Array.prototype.clone = function(){
	var i = this.length, clone = new Array(i);

	while(i--) clone[i] = util.clone(this[i]);

	return clone;
}

[Array].forEach(function(constructor){
	Object.defineProperty(constructor.prototype, 'clone', {
		value: constructor.prototype.clone
	});
});

module.exports = util;
