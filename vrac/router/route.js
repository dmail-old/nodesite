/*

on utiliseras routelexer au lieu des regexp
une fois qu'on auras fait tout ça on testeras que les routes fonctionne bien

*/

var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;
var optionalParam = /\((.*?)\)/g;
var namedParam = /(\(\?)?:\w+/g;
var splatParam = /\*\w+/g;

var Route = {
	test: null,
	listener: null,
	bind: null,
	regExp: null,

	// TODO route match only some methods, je pense pas qu'on le mettras là
	method: null,

	init: function(test, listener, bind){
		this.test = test;			
		this.listener = listener;
		this.bind = this || bind;

		this.match = this.createMatchFunction(test);
	},

	macthRegExp: function(url){
		var match = this.regExp.exec(url);
		if( match ){
			if( match.length > 1 ) return match.slice(1);
			return [];
		}
		return false;
	},

	fromRegExp: function(regExp){
		this.regExp = regExp;
		return this.macthRegExp;
	},

	fromString: function(string){
		// Convert a string into a regular expression, suitable for matching against the current location hash.
		string = string.replace(escapeRegExp, '\\$&');
		string = string.replace(optionalParam, '(?:$1)?');
		string = string.replace(namedParam, function(match, optional){
			return optional ? match : '([^/?]+)';
		});
		string = string.replace(splatParam, '([^?]*?)');
		return this.fromRegExp(new RegExp('^' + string + '(?:\\?([\\s\\S]*))?$'));
	},

	createMatchFunction: function(test){
		if( typeof test == 'string' ){
			return this.fromString(test);
		}
		if( test instanceof RegExp ){
			return this.fromRegExp(test);
		}
		if( typeof test == 'function' ){
			return test;
		}

		throw new Error('route test must be a string, regexp or function');
	},

	getParameters: function(url){
		var params = this.match(url);

		params = params.map(function(param, index){
			// Don't decode the search params.
			if( index === params.length - 1 ) return param || null;
			return param ? decodeURIComponent(param) : null;
		});

		return params;
	}
};

module.exports = Route;