/*

require: Object.util

provide: NS.options

*/

// create a deep copy of object still linked to every object or subobject by prototype
Object.copy = function(object){
	// Object.create return a copy of the object passed still linked to object by prototype
	// Consequently modifying object impacts the copy

	var copy = Object.create(object), key, value;

	for(key in copy){
		value = copy[key];
		if( typeof value == 'object' && value !== null ) copy[key] = Object.copy(value);
	}

	return copy;
};

NS.options = {
	setOptions: function(options){

		// only if this has not yet an options object
		if( !this.hasOwnProperty('options') ){
			// create object derived from parent options
			if( 'options' in this ){
				this.options = Object.copy(this.options);
			}
			else{
				this.options = {};
			}
		}

		if( options ){
			Object.merge(this.options, options);
		}

		return this;
	}
};
