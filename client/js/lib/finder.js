/*
---

name: Finder

description: Help to get match(es) against a function called in a loop

requires: Object.path, Function.TRUE, Function.FALSE

provides: Finder

...
*/

(function(){

var Finder = this.Finder = {
	getProperty: function(item, key){
		return Object.getAt(item, key);
	},
	
	hasProperty: function(item, key){
		return item ? item.hasOwnProperty(key) : false;
	},
	
	matchPart: function(item, part){
		if( part.operator ) return part.test(String(Finder.getProperty(item, part.key)).toLowerCase());
		return Finder.hasProperty(item, part.key);
	}
};

// on ne prend pas en compte les espaces \\s*
// on chope key operator si possible (?:\\s*(<unicode>+)\\s*([!]?[<operator>]))?
// on ne prend pas en compte les espaces \\s*
// on chope quotedvalue ou value (?:\"(.+)\"|[^<operator>])
// qui peut contenir des espaces ce qu'on vérifie par (?=\\s+.+[<operator>]|$) cad suivi d'un opérateur ou fin de chaine
// comme on fait trim() sur la chaine les espaces de fin de chaine ne sont pas considéré comme une valeur ce qui aurait été le cas pour "a   "

Finder.exp = "^(?:\\s*(<unicode>+)\\s*([!]?[<operator>]))?\\s*(?:\"(.+)\"|([^<operator>]+)(?=\\s+.+[<operator>]|$))"
	.replace(/<unicode>/, '(?:[:\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
	.replace(/operator/g, ':<>');
Finder.regexp = new RegExp(Finder.exp);

Finder.parser = function(match, key, operator, quotedValue, value){
	if( quotedValue ) value = quotedValue;
	if(	value ){
		if( value == '*' ){
			if( key ) Finder.parsed.push({key:key}); // value == '*' means hasOwnProperty
			return ''; // but if no property given it means always true
		}
		if( !key ) key = 'name';
		if( !operator ) operator = ':';
		
		if( operator == ':' ){
			var star = value.indexOf('*',1), len = value.length;	
			
			if( star != -1 ){
				// ~= a star is in middle of the value -> test by regexp
				if( star != len-1 ) operator = '~:';
				// else star si at the begining or at the end or both
				else{
					var firstChar = value.charAt(0), lastChar = value.charAt(len-1);
					
					if( firstChar in {'"':1, '*':1} && firstChar == lastChar ){
						operator = '*:';
						value = value.substring(1, len-1);
					}
					else if( firstChar == '*' ){
						operator = '$:';
						value = value.substring(1);
					}
					else if( lastChar == '*' ){
						operator = '^:';
						value = value.substring(0, len-1);
					}
				}
			}
		}
		
		// default case insensitivity over the value
		// value = value.toLowerCase();
		
		var test;
		switch(operator){
			case ':': test = function(data){ return data === value; }; break;
			case '>': test = function(data){ return data > value; }; break;
			case '<': test = function(data){ return data < value; }; break;
			case '!:': test = function(data){ return data != value; }; break;
			case '*:': test = function(data){ return data.contains(value); }; break;
			case '^:': test = function(data){ return data.startsWith(value); }; break;
			case '$:': test = function(data){ return data.endsWith(value); }; break;
			case '~:':
				var regexp = new RegExp(value.escapeRegExp().replace(/\\\*/g,'.'));
				test = function(data){ return data && regexp.test(data); };
			break;
		}
		
		Finder.parsed.push({
			key: key,
			operator: operator,
			value: value,
			test: test
		});
	}
	
	return '';
};

Finder.cache = {};
Finder.parse = function(expression){
	expression = String(expression).trim(); // remove begining and ending spaces
	var parsed = Finder.cache[expression];
	
	if( !parsed ){
		parsed = Finder.parsed = [];
		parsed.isParse = true;
		parsed.raw = expression;
		while( expression != (expression = expression.replace(Finder.regexp, Finder.parser)) );
		Finder.cache[parsed.raw] = parsed;
	}
	
	return parsed;
};

// turn the first argument into a function who returns if the first arguments supplied match
// ex: Finder.from('name:hello') -> function(item){ return item.name == 'hello'; };
Finder.from = function(expression, reverse){
	if( expression == null ) return reverse ? Function.TRUE : Function.FALSE;
	
	var match;
	switch(typeof expression){
		case 'function':
			match = expression;
		break;
		case 'number':
			var number = expression;
			match = function(){
				if( number === 0 ){ number = null;/*number = expression;*/ return true; }
				number--;
				return false;
			};
		break;
		case 'string':
			expression = Finder.parse(expression); // no break to go to expression.isParse			
		case 'object':
			if( expression.isParse ){
				match = function(item){
					var i = expression.length;
					while(i--) if( !Finder.matchPart(item, expression[i]) ) return false;
					return true;
				}
				break;
			}
			
			if( Array.isArray(expression) ){
				var i = expression.length;
				if( i === 0 ) match = Function.FALSE;
				else if( i === 1 ) match = Finder.from(expression[0], reverse);
				else{
					// each array item is turned into a function
					var matchers = expression.map(function(exp){ return Finder.from(exp, reverse); });
					match = function(item){
						var i = 0, j = matchers.length;
						for(;i<j;i++) if( !matchers[i](item) ) return false;
						return true;
					}
				}
			}
			else if( expression instanceof RegExp ){
				match = expression.test;
			}
			else{
				match = function(item){ return item == expression; };
			}
		break;
		case 'boolean':
			return expression || reverse ? Function.TRUE : Function.FALSE;
		break;
		default:
			throw new TypeError('Unknow type'); // never supposed to happen
		break;
	}
	
	return reverse ? function(item){ return !match(item); } : match;
}

// iterator supply items to test, we returns the first or all items passing the test
Finder.matchIterator = function(iterator, match, first){
	var found = first ? null : [];
	
	match = Finder.from(match);
	if( match != Function.FALSE ){
		iterator.call(this, function(item){
			if( match.call(item, item) === true ){
				if( first ){
					found = item;
					return true;
				}
				found.push(item);
			}
		});
	}
	
	return found;
};

// not implemented, would allow an option to tell to test a property with indexOf instead of == without having to pass '*'
function getPartial(expression){
	var parsed = Finder.parse(expression), j = parsed.length;
	
	function match(item){
		var i = j;
		while(i--){
			part = parsed[i];
			if( part.operator == ':' && part.key.endsWith('name') ){
				var name = String(Object.getAt(item, part.key)).toLowerCase(), value = part.value.split(/\s+/g), j = value.length;
				while(j--) if( name.indexOf(value[j]) > -1 ) break;
				// si j vaut -1 c'est que indexOf a échoué sur toutes les parties du nom recherché
				if( j < 0 ) return false;
			}
			else if( !Finder.matchPart(item, part) ) return false;
		}
		return true;
	}
	
	return match;
};

}).call(window);