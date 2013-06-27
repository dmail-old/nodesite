/*
---

name: Filter

description: Help to get match(es) against a function called in a loop

requires: Object.at, Function.TRUE, Function.FALSE

provides: Filter

...
*/

NS.Filter = {
	ACCEPT: true, // a filter return true? what have found what we wanted break the loop
	REJECT: false, // a filter return reject? we continue the loop
	SKIP: 2, // only used in netxNode, prevNode, reject a node without invalidating it's descendant	

	toFilter: function(filter, reverse){

		if( filter == null ){
			filter = Function.FALSE;
		}
		else if( typeof filter == 'object' ){
			filter = function(item){ return item === filter; };
		}
		else if( typeof filter.toFilter == 'function' ){
			filter = filter.toFilter();
		}

		if( typeof filter != 'function' ){
			throw new TypeError('filter must be a function' + filter);
		}

		return reverse ? function(item){ return !filter(item); } : filter;
	},

	// iterator supply items to test, we returns the first or all items filtered
	filterIterator: function(iterator, iteratorBind, first, filter, bind){
		var found = first ? null : [], result;

		filter = this.toFilter(filter);
		if( filter != Function.FALSE ){
			iterator.call(iteratorBind, function(item){
				result = filter.call(bind, item);

				if( result === NS.Filter.ACCEPT ){
					if( first ){
						found = item;
					}
					else{
						found.push(item);
						// simulate that the item isn't accepted to keep looping
						result = NS.Filter.SKIP;
					}
				}

				return result;
			});
		}

		return found;
	},

	// unused, would allow to test a value with indexOf over each space separated words
	getPartial: function(expression){
		var parsed = this.parse(expression);

		function match(item){
			var i = parsed.length, part;
			while(i--){
				part = parsed[i];
				if( part.operator == ':' && part.key.endsWith('name') ){
					var name = String(Object.getAt(item, part.key)), value = part.value.split(/\s+/g), j = value.length;
					while(j--) if( name.indexOf(value[j]) > -1 ) break;
					// si j vaut -1 c'est que indexOf a échoué sur toutes les parties du nom recherché
					if( j < 0 ) return false;
				}
				else if( !this.matchPart(item, part) ) return false;
			}
			return true;
		}

		return match;
	}
};

Boolean.implement('toFilter', function(){
	return this.valueOf() === true ? Function.TRUE : Function.FALSE;
});
Number.implement('toFilter', function(){
	var count = this;

	return function(){
		if( count === 0 ){
			return NS.Filter.ACCEPT;
		}
		count--;
		return NS.Filter.REJECT;
	};
});
RegExp.implement('toFilter', function(){
	return this.test;
});
Function.implement('toFilter', Function.THIS);
Array.implement('toFilter', function(){

	if( this.length === 0 ) return Function.FALSE;
	if( this.length == 1 ) return NS.Filter.toFilter(this[0]);

	var filters = this.map(NS.Filter.toFilter, NS.Filter);

	return function(item){
		var i = 0, j = filters.length;
		for(;i<j;i++){
			if( !filters[i](item) ) return false;
		}
		return true;
	};
});

/*

Supporting String.prototype.toFilter

*/

NS.Filter.Parser = {
	cache: {},
	expression: null,
	raw: null,
	parts: null,
	part: null,
	comparers: {
		':': function(a, b){ return a === b; },
		'>': function(a, b){ return a > b; },
		'<': function(a, b){ return a < b; },
		'!:': function(a, b){ return a != b; },
		'*:': function(a, b){ return a.contains(b); },
		'^:': function(a, b){ return a.startsWith(b); },
		'$:': function(a, b){ return a.endsWith(b); },
		'~:': function(a, b){ return a && b.test(a); }
	},

	constructor: function(expression){
		this.parts = [];
		this.raw = expression;
		this.expression = expression;

		this.cache[expression] = this;

		return this;
	},

	getProperty: function(item, key){
		return Object.getAt(item, key);
	},

	hasProperty: function(item, key){
		return item ? item.hasOwnProperty(key) : false;
	},

	matchPart: function(item, part){
		var compare = part.compare;

		if( compare ){
			return compare(String(this.getProperty(item, part.key)), part.value);
		}
		return this.hasProperty(item, part.key);
	},

	filter: function(item){
		var i = this.parts.length;

		while(i--){
			if( !this.matchPart(item, this.parts[i]) ) return false;
		}

		return true;
	},

	toFilter: function(){
		return this.filter.bind(this);
	},

	parse: function(){
		var expression = this.expression, prev, parser = this.parser.bind(this);

		do{
			prev = expression;
			expression = expression.replace(this.regexp, parser);
		}
		// tant que l'expression change on continue de parser
		while(expression != prev);

	},

	parseOperator: function(operator){
		// when operator is : check for presence of '*'
		if( operator == ':' ){
			var value = this.part.value, star = value.indexOf('*', 1), len = value.length;

			if( star != -1 ){
				// ~= a * is in middle of the value -> test by regexp
				if( star != len - 1 ){
					operator = '~:';
					this.part.value = new RegExp(value.escapeRegExp().replace(/\\\*/g, '.'));
				}
				// else * is at the begining, at the end or both
				else{
					var firstChar = value.charAt(0), lastChar = value.charAt(len-1);

					// * surround the string wich mean contains
					if( (firstChar == '"' || firstChar == '*') && firstChar == lastChar ){
						operator = '*:';
						this.part.value = value.substring(1, len - 1);
					}
					// * is firstChar wich means startsWith
					else if( firstChar == '*' ){
						operator = '$:';
						this.part.value = value.substring(1);
					}
					// * is lastChar wich means endsWith
					else if( lastChar == '*' ){
						operator = '^:';
						this.part.value = value.substring(0, len - 1);
					}
				}
			}
		}

		return operator;
	},

	parser: function(match, key, operator, quotedValue, value){
		if( quotedValue ) value = quotedValue;

		if(	value ){
			if( !key ) key = 'name';
			if( !operator ) operator = ':';

			this.part = {
				key: key,
				operator: operator,
				value: value,
				compare: null
			};

			if( operator == ':' ) this.part.operator = this.parseOperator(operator);
			if( value != '*' ) this.part.compare = this.comparers[this.part.operator];

			this.parts.push(this.part);
			this.part = null;
		}

		return '';
	}
};

/*

Ces instructions se suivent l'une après l'autre pour remplir les arguments de parser

on ne prend pas en compte les espaces \\s*
on récupère key et operator si possible (?:\\s*(<unicode>+)\\s*([!]?[<operator>]))?
on ne prend pas en compte les espaces \\s*
on récupère value grâce à quotedvalue ou value (?:\"(.+)\"|[^<operator>])
qui peut contenir des espaces ce qu'on vérifie par (?=\\s+.+[<operator>]|$) cad
suivi d'un opérateur ou fin de chaine
comme on fait trim() sur la chaine les espaces de fin de chaine ne sont pas
considéré comme une valeur ce qui aurait été le cas pour "a   "

*/
NS.Filter.Parser.exp = "^(?:\\s*(<unicode>+)\\s*([!]?[<operator>]))?\\s*(?:\"(.+)\"|([^<operator>]+)(?=\\s+.+[<operator>]|$))";
NS.Filter.Parser.exp = NS.Filter.Parser.exp.replace(/<unicode>/, '(?:[:\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])');
NS.Filter.Parser.exp = NS.Filter.Parser.exp.replace(/operator/g, ':<>');
NS.Filter.Parser.regexp = new RegExp(NS.Filter.Parser.exp);

String.implement('toFilter', function(){
	// remove begining and ending spaces
	var expression = String(this).trim(), parsed;

	if( expression in NS.Filter.Parser.cache ){
		parsed = NS.Filter.Parser.cache[expression];
	}
	else{
		parsed = NS.Filter.Parser.new(expression);
		parsed.parse();
	}

	return parsed.toFilter();
});
