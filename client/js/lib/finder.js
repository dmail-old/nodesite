/*
---

name: Finder

description: Help to get match(es) against a function called in a loop

requires: Object.at, Function.TRUE, Function.FALSE

provides: Finder

...
*/

NS.Finder = {
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

	/*
	turn expression into function returning if its first argument match

	NS.Finder.toFilter('name:hello') -> function(item){ return item.name == 'hello'; };
	'name:hello'.toFilter() would do the same
	*/
	toFilter: function(expression, reverse){
		var filter;

		if( expression == null ){
			filter = Function.FALSE;
		}
		else if( typeof expression == 'object' ){
			filter = function(item){ return item === expression; };
		}
		else if( typeof expression.toFilter == 'function' ){
			filter = expression.toFilter();
		}

		if( typeof filter != 'function' ){
			throw new TypeError('filter must be a function');
		}

		return reverse ? function(item){ return !filter(item); } : filter;
	},

	// iterator supply items to test, we returns the first or all items passing the test
	matchIterator: function(iterator, iteratorBind, match, first, bind){
		var found = first ? null : [];

		match = this.toFilter(match);
		if( match != Function.FALSE ){
			iterator.call(iteratorBind, function(item){
				if( match.call(bind, item) === true ){
					if( first ){
						found = item;
						return true;
					}
					found.push(item);
				}
			});
		}

		return found;
	},

	// unused, would allow an option to tell to test a property with indexOf instead of == without having to pass '*'
	getPartial: function(expression){
		var parsed = this.parse(expression);

		function match(item){
			var i = parsed.length, part;
			while(i--){
				part = parsed[i];
				if( part.operator == ':' && part.key.endsWith('name') ){
					var name = String(Object.getAt(item, part.key)).toLowerCase(), value = part.value.split(/\s+/g), j = value.length;
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
	return this === true ? Function.TRUE : Function.FALSE;
});
Number.implement('toFilter', function(){
	var count = this;

	return function(){
		if( count === 0 ){
			return true;
		}
		count--;
		return false;
	};
});
RegExp.implement('toFilter', function(){
	return this.test;
});
Function.implement('toFilter', Function.THIS);
Array.implement('toFilter', function(){

	if( this.length === 0 ) return Function.FALSE;
	if( this.length == 1 ) return NS.Finder.toFilter(this[0]);

	var filters = this.map(NS.Finder.toFilter, NS.Finder);

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

NS.Finder.Parser = {
	cache: {},
	expression: null,
	raw: null,
	parts: null,
	part: null,
	operators: {
		':': function(a, b){ return a === b; },
		'>': function(a, b){ return a > b; },
		'<': function(a, b){ return a < b; },
		'!:': function(a, b){ return a != b; },
		'*:': function(a, b){ return a.contains(b); },
		'^:': function(a, b){ return a.startsWith(b); },
		'$:': function(a, b){ return a.endsWith(b); },
		'~:': function(a, b){
			var regexp = new RegExp(b.escapeRegExp().replace(/\\\*/g,'.'));
			return a && regexp.test(a);
		}
	},

	constructor: function(expression){
		// remove begining and ending spaces
		expression = String(expression).trim();

		if( expression in this.cache ){
			return this.cache[expression];
		}
		else{
			this.parts = [];
			this.raw = expression;
			this.expression = expression;
			this.parse();

			this.cache[expression] = this;

			return this;
		}
	},

	toFilter: function(){
		var parts = this.parts;

		return function(item){
			var i = parts.length;
			while(i--) if( !NS.Finder.matchPart(item, parts[i]) ) return false;
			return true;
		};
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
		if( operator == ':' ){
			var value = this.part.value, star = value.indexOf('*', 1), len = value.length;

			if( star != -1 ){
				// ~= a star is in middle of the value -> test by regexp
				if( star != len - 1 ) operator = '~:';
				// else star si at the begining, at the end or both
				else{
					var firstChar = value.charAt(0), lastChar = value.charAt(len-1);

					// * surround the string wich mean contains
					if( (firstChar == '"' || firstChar == '*') && firstChar == lastChar ){
						operator = '*:';
						this.part.value = value.substring(1, len-1);
					}
					// * is firstChar wich means startsWith
					else if( firstChar == '*' ){
						operator = '$:';
						this.part.value = value.substring(1);
					}
					// * is lastChar wich means endsWith
					else if( lastChar == '*' ){
						operator = '^:';
						this.part.value = value.substring(0, len-1);
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
				value: value
			};

			if( operator == ':' ){
				this.part.operator = operator = this.parseOperator(operator);
			}
			if( value != '*' ){
				this.part.compare = this.operators[operator];
			}

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
NS.Finder.Parser.exp = "^(?:\\s*(<unicode>+)\\s*([!]?[<operator>]))?\\s*(?:\"(.+)\"|([^<operator>]+)(?=\\s+.+[<operator>]|$))";
NS.Finder.Parser.exp = NS.Finder.Parser.exp.replace(/<unicode>/, '(?:[:\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])');
NS.Finder.Parser.exp = NS.Finder.Parser.exp.replace(/operator/g, ':<>');
NS.Finder.Parser.regexp = new RegExp(NS.Finder.Parser.exp);

String.implement('toFilter', function(){
	return NS.Finder.Parser.new(this).toFilter();
});
