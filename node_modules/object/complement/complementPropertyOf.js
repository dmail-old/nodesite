var implementProperty = require('object/implement/implementPropertyOf');

function complementProperty(object, name, owner){
	name = typeof name == 'symbol' ? name.toString() : String(name);
	if( !(name in object) ){
		implementProperty(object, name, owner);
	}
}

module.exports = complementProperty;