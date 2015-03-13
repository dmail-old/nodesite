var completePropertyOf;

if( Object.defineProperty ){
	completePropertyOf = function(object, name, owner){
		name = String(name);
		if( !(name in object) ){
			Object.defineProperty(object, name, Object.getOwnPropertyDescriptor(owner, name));
		}
	};
}
else{
	completePropertyOf = function(object, name, owner){
		name = String(name);
		if( !(name in object) ){
			object[name] = owner[name];
		}
	};
}

module.exports = completePropertyOf;