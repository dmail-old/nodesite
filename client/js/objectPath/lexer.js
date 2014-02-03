window.PartLexer = {
	separators: '.[]()',
	quote: '"',
	buffer: null,
	length: null,
	index: null,

	create: function(buffer){
		this.buffer = buffer;
		this.length = buffer.length;
		this.index = -1;
	},

	is: function(chars, char){
		return chars.indexOf(char) !== -1;
	},

	isSeparator: function(char){
		return this.is(this.separators, char);
	},

	isQuote: function(char){
		return char == this.quote;
	},

	isNumber: function(char){
		return '0' <= char && char <= '9';
	},

	isAlpha: function(char){
		return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_' || char === '$';
	},

	isAlphaNum: function(char){
		return this.isAlpha(char) || this.isNumber(char);
	},

	charAt: function(index){
		return this.buffer.charAt(index);
	},

	error: function(error){
		return new Error('PartLexer Error: ' + error);
	},

	hasNext: function(){
		return this.index < this.length;
	},

	nextChar: function(){
		this.index++;
		if( this.hasNext() ){
			return this.charAt(this.index);
		}
		return false;		
	},

	next: function(){
		var char, end, token = null;

		while( char = this.nextChar() ){
			// skip those special chars
			if( this.isSeparator(char) ){
				continue;
			}

			// begining of a token
			if( this.isAlphaNum(char) ){
				token = {
					index: this.index,
					value: char,
					isMethod: false
				};

				while( (char = this.nextChar()) && this.isAlphaNum(char) ){
					token.value+= char;
				}

				if( char == '(' && this.nextChar() == ')' ){
					token.isMethod = true;
				}

				break;
			}
			// begining of a token in quote like ["ok"]
			if( this.isQuote(char) ){
				token = {
					index: this.index,
					value: ''
				};

				while( (char = this.nextChar()) && !this.isQuote(char) ){
					token.value+= char;
				}

				if( token.index != this.index && !this.isQuote(char) ){
					throw this.error('Unterminated quote at ' + token.index);
				}

				break;
			}

			throw this.error('Unexpected char at ' + this.index);
		}

		return token;
	},	

	parse: function(){
		var parts = [], part;

		while( part = this.next() ){
			parts.push(part);
		}

		return parts;
	}
};