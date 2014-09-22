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

var util = {
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
