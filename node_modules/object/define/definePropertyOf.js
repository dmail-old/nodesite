var definePropertyOf;

if( Object.defineProperty ){
	definePropertyOf = function(object, name, owner){
		var descriptor = Object.getOwnPropertyDescriptor(owner, name);
		Object.defineProperty(object, name, descriptor);
	};
}
else{
	definePropertyOf = function(object, name, owner){
		object[name] = owner[name];
	};
}

module.exports = definePropertyOf;