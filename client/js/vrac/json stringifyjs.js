// permet de sauvegarder des focntions au format JSON
JSON.parseJS = function(js){
	return JSON.parse(js, function(key, value){
		if( typeof value == 'string' && value.indexOf('(function ') === 0 ) return eval(value);
		return value;
	});
};

// permet de récupérer des fonctions au format JSON
JSON.stringifyJS = function(item){
	return JSON.stringify(item, function(key, value){
		if( typeof value == 'function' ) return '('+value.toString()+')';
		return value;
	});
};