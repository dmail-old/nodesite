var implementPropertyOf;

if( Object.defineProperty ){
	implementPropertyOf = function(object, name, owner){
		var descriptor = Object.getOwnPropertyDescriptor(owner, name);
		descriptor.enumerable = false;
		Object.defineProperty(object, name, descriptor);
	};
}
else{
	implementPropertyOf = function(object, name, owner){
		object[name] = owner[name];
	};
}

module.exports = implementPropertyOf;