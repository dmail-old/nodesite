require('object/implementProperty');

function complementProperty(object, name, value, force){
	name = typeof name == 'symbol' ? name.toString() : String(name);
	if( force || !(name in object) ){
		Object.implementProperty(object, name, value);
	}
}

module.exports = complementProperty;
Object.complementProperty = complementProperty;