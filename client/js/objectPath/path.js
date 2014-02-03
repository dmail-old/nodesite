/*

name: ObjectPath

description: Help to set/get a value at a given path in an object

provides: ObjectPath

*/

window.ObjectPath = (function(Lexer, Part){

	var Path = {
		path: null,
		lexer: Lexer,
		firstPart: null,
		lastPart: null,
		partConstructor: Part,

		create: function(path){
			this.path = path;
			this.parse();
		},

		createPart: function(){
			return this.partConstructor.new.apply(this.partConstructor, arguments);
		},

		parse: function(){
			var lexer = this.lexer.new(this.path), token, part = null, previousPart = null;

			while( token = lexer.token() ){
				// créer une partie depuis une chaine alphanumeric ou un nombre
				if( token.name == 'IDENTIFIER' || token.name == 'NUMBER' ){
					if( part ){
						previousPart = part;
					}
					part = this.createPart(token.value);

					if( previousPart ){
						previousPart.nextPart = part;
						part.previousPart = previousPart;
					}
					else{
						this.firstPart = part;
					}
				}
				// previous part is a method
				else if( token.name == 'L_PAREN' ){
					part.isMethod = true;
				}
			}

			this.lastPart = part;
		},

		setModel: function(model){
			this.firstPart.setModel(model);
			return this;
		},

		get: function(){
			return this.lastPart.get();
		},

		set: function(value){
			return this.lastPart.set(value);
		},

		apply: function(bind, args){
			var fn = this.get();
			return typeof fn == 'function' ? fn.apply(bind, args) : undefined;
		},

		call: function(bind){
			return this.apply(bind, Array.slice(arguments, 3));
		}
	};

	return Path;

})(window.Lexer, window.PathPart);


/**

Replace {.*?} into a string by key/value of object

*/

RegExp.BRACLET = /\\?\{([\w.]+)\}/g;

String.implement('parse', function(object){
	return String(this).replace(RegExp.BRACLET, function(match, path){
		if( match.charAt(0) == '\\' ) return match.slice(1);
		var value = window.ObjectPath.new(path).setModel(object).get();
		return value != null ? value : '';
	});
});

/**

Sort an array towards the properties of object he contains

orderBy('name');
orderBy('name');
orderBy('name', 'index', -1, function(a){ return a.name.toLowerCase(); }, 'getCount()');

*/

Array.getComparer = function(){
	var i, n, j = arguments.length, fns = [], orders = [], arg;

	i = n = 0;

	for(;i<j;i++){
		arg = arguments[i];
		switch(typeof arg){
		case 'string':
			arg = function(propertyPath, item){
				return propertyPath.setModel(item).get();
			}.curry(window.ObjectPath.new(arg));
			break;
		case 'function':
			fns[n++] = arg;
			break;
		case 'number':
			if( n ) orders[n-1] = arg;
			break;
		}
	}

	function compare(a,b){
		var calc, va, vb;
		for(i=0;i<n;i++){
			calc = fns[i];
			va = calc.call(a, a);
			vb = calc.call(b, b);

			if( va > vb ) return orders[i] || 1;
			if( va < vb ) return -(orders[i] || 1);
		}
		return 0;
	}

	return compare;
};

Array.implement('orderBy', function(){
	return this.sort(Array.getComparer.apply(Array, arguments));
});
