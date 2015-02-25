/*

name: property

description: Help to manipulate object properties, required almost everywhere

*/

var property = {
	forEachKeyIn: function(object, fn, bind){
		for(var key in object) fn.call(bind, key, object);
		return object;
	},

	forEachKey: function(object, fn, bind){
		var keys = Object.keys(object), i = 0, j = keys.length;

		for(;i<j;i++){
			fn.call(bind, keys[i], object);
		}

		return object;
	}
};

if( 'getOwnPropertyDescriptor' in Object ){
	/*
	forEachName: function(object, fn, bind){
		var names = Object.getOwnPropertyNames(object), i = 0, j = names.length;

		for(;i<j;i++){
			fn.call(bind, names[i], object);
		}

		return object;
	},

	forEach: function(object, fn, bind){
		var names = Object.getOwnPropertyNames(object), name, i, j, proto, protoNames;

		i = 0;
		j = names.length;
		for(;i<j;i++){
			name = names[i];
			fn.call(bind, name, object);
		}

		proto = object;
		while( proto = Object.getPrototypeOf(proto) ){
			if( proto == Object.prototype ) break;

			protoNames = Object.getOwnPropertyNames(proto);
			i = 0;
			j = protoNames.length;
			for(;i<j;i++){
				name = protoNames[i];
				if( names.indexOf(name) === -1 ){
					names.push(name);
					fn.call(bind, name, proto);
				}
			}
		}
	}
	*/
	/*
	property.getPropertyOwner = function(object, name){
		while( object ){
			if( Object.prototype.hasOwnProperty.call(object, name) ) return object;
			object = Object.getPrototypeOf(object);
		}
		return null;
	};

	property.getPropertyDescriptor = function(object, name){
		object = property.getPropertyOwner(object, name);
		return object ? Object.getOwnPropertyDescriptor(object, name) : null;
	};
	*/
}

/*
var API = {
	complete: function(object){
		this.forEachKeyIn(Array.prototype.slice.call(arguments, 1), this.completeProperty, object);
		return object;
	}
};

for(var method in API){
	property[method] = API[method];
}
*/

Object.forEach = exports.forEach;

module.exports = property;