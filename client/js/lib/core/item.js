/*

require: Object.eachObjectIn, Object.eachOwnPair, Object.setPair, Object.eachPair

*/

NS.Item = {
	implementPair: function(key, value){

		if( typeof value == 'object' && value !== null ){
			var current = this[key];
			// when an object exists in this and in value for key
			// we create an object heriting from current then we merge it
			if( typeof current == 'object' && current !== null ){
				current = this[key] = Object.create(current);
				Object.eachOwnPair(value, NS.Item.implementPair, current);
			}
			else{
				Object.setPair.apply(this, arguments);
			}
		}
		else{
			Object.setPair.apply(this, arguments);
		}

		return this;
	},

	implement: function(){
		Object.eachObjectIn(arguments, 'eachPair', NS.Item.implementPair, this);
		return this;
	},

	extend: function(){
		var object = Object.create(this);

		NS.Item.implement.apply(object, arguments);

		return object;
	},

	// return an instance of this calling it's constructor
	new: function(){
		var instance = Object.create(this), constructor = instance.constructor;

		if( typeof constructor == "function" ) instance.constructor.apply(instance, arguments);

		return instance;
	},

	getPrototype: function(){
		return Object.getPrototypeOf(this);
	},

	getParentPrototype: function(){
		var proto = NS.Item.getPrototype.call(this);
		return proto ? NS.Item.getPrototype.call(proto) : null;
	}
};

if( !Object.create ){
	Object.create = function(object){
		var F = function(){};
		F.prototype = object;
		return new F();
	};
}
