(function(Selector){

	var StringSelector = Selector.extend({
		cache: {},
		raw: null,
		parts: null,
		part: null,
		parsed: false,
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

		new: function(string){
			string = string.trim();
			if( string in this.cache ){
				return this.cache[string];
			}
			return Object.prototype.new.apply(this, arguments);
		},

		create: function(string){
			this.raw = string;
			this.cache[string] = this;
			Selector.create.apply(this, arguments);
			this.parse();
		},

		getProperty: function(item, key){
			return item ? window.ObjectPath.new(key).setModel(item).get() : false;
		},

		hasProperty: function(item, key){
			return item ? window.ObjectPath.new(key).setModel(item).has() : false;
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

		parse: function(){
			if( this.parsed ) return;

			var selector = this.selector, prev, parser = this.parser.bind(this);

			this.parts = [];

			do{
				prev = selector;
				selector = selector.replace(this.regexp, parser);
			}
			// tant que string change on continue de parser
			while(selector != prev);

			this.parsed = true;
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
		},

		// unused, would allow to test a value with indexOf over each space separated words
		getPartial: function(expression){
			var parsed = this.parse(expression);

			function match(item){
				var i = parsed.length, part;
				while(i--){
					part = parsed[i];
					if( part.operator == ':' && part.key.endsWith('name') ){
						var value, search = part.value.split(/\s+/g), j = search.length;

						value = String(this.getProperty(item, part.key));
						while(j--) if( value.indexOf(search[j]) > -1 ) break;
						// si j vaut -1 c'est que indexOf a échoué sur toutes les parties du nom recherché
						if( j < 0 ) return false;
					}
					else if( !this.matchPart(item, part) ) return false;
				}
				return true;
			}

			return match;
		}
	});

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
	
	StringSelector.exp = "^(?:\\s*(<unicode>+)\\s*([!]?[<operator>]))?\\s*(?:\"(.+)\"|([^<operator>]+)(?=\\s+.+[<operator>]|$))";
	StringSelector.exp = StringSelector.exp.replace(/<unicode>/, '(?:[:\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])');
	StringSelector.exp = StringSelector.exp.replace(/operator/g, ':<>');
	StringSelector.regexp = new RegExp(StringSelector.exp);

	Selector.addConstructor('string', StringSelector);

})(NS.Selector);