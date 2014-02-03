// http://architects.dzone.com/articles/hand-written-lexer-javascript
window.Lexer = {
	buffer: null,
	length: null,
	index: 0,
	quote: '"',
	OPERATORS: {
		'+':  'PLUS',
		'-':  'MINUS',
		'*':  'MULTIPLY',
		'.':  'PERIOD',
		'\\': 'BACKSLASH',
		':':  'COLON',
		'%':  'PERCENT',
		'|':  'PIPE',
		'!':  'EXCLAMATION',
		'?':  'QUESTION',
		'#':  'POUND',
		'&':  'AMPERSAND',
		';':  'SEMI',
		',':  'COMMA',
		'(':  'L_PAREN',
		')':  'R_PAREN',
		'<':  'L_ANG',
		'>':  'R_ANG',
		'{':  'L_BRACE',
		'}':  'R_BRACE',
		'[':  'L_BRACKET',
		']':  'R_BRACKET',
		'=':  'EQUALS'
	},

	create: function(buffer){
		this.buffer = buffer;
		this.length = buffer.length;
		this.index = 0;
	},

	isWhiteSpace: function(char){
		// IE treats non-breaking space as \u00A0
		return char === ' ' || char === '\r' || char === '\t' || char === '\n' || char === '\v' || char === '\u00A0';
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

	isNewLine: function(char) {
		return char === '\r' || char === '\n';
	},

	charAt: function(index){
		return this.buffer.charAt(index);
	},

	indexOf: function(char){
		return this.buffer.indexOf(char);
	},

	slice: function(index, end){
		return this.buffer.slice(index, end);
	},	

	error: function(error, start, end){
		throw new Error('lexer error, todo');
	},

	readComment: function(){
		var end = this.index + 2, char = this.charAt(end);

		// Skip until the end of the line
		while( end < this.length && !this.isNewLine(this.charAt(end)) ){
			end++;
		}

		var token = {
			name: 'COMMENT',
			value: this.slice(this.index, end),
			index: this.index
		};
		this.index = end + 1;

		return token;
	},

	readQuote: function(){
		// this.pos points at the opening quote. Find the ending quote.
		var end = this.indexOf(this.quote, this.index + 1);

		if( end === -1 ) {
			throw Error('Unterminated quote at ' + this.index);
		}

		var token = {
			name: 'QUOTE',
			value: this.slice(this.index, end + 1),
			index: this.index
		};
		this.index = end + 1;

		return token;
	},

	readNumber: function(){
		var end = this.index + 1;
		while( end < this.length && this.isNumber(this.charAt(end)) ){
			end++;
		}

		var token = {
			name: 'NUMBER',
			value: this.slice(this.index, end),
			index: this.index
		};

		this.index = end;

		return token;
	},

	readIdentifier: function(){
		var end = this.index + 1;
		while( end < this.length && this.isAlphaNum(this.charAt(end)) ){
			end++;
		}

		var token = {
			name: 'IDENTIFIER',
			value: this.slice(this.index, end),
			index: this.index
		};

		this.index = end;

		return token;
	},

	token: function(){
		if( this.index >= this.length ){
			return null;
		}

		// The char at this.pos is part of a real token. Figure out which.
		var char = this.charAt(this.index);

		// skip whitespace
		while( this.isWhiteSpace(char) ){
			this.index++;
			char = this.charAt(this.index);
		}

		// '/' is treated specially, because it starts a comment if followed by
		// another '/'. If not followed by another '/', it's the DIVIDE operator.
		if( char === '/' ){
			if( this.charAt(this.index + 1) === '/' ){
				return this.readComment();
			}
			
			return {
				name: 'DIVIDE',
				value: '/',
				index: this.index++
			};
		}
		
		// Look it up in the table of operators
		var operator = this.OPERATORS[char];
		if( operator !== undefined ){
			return {
				name: operator,
				value: char,
				index: this.index++
			};
		}

		// Not an operator - so it's the beginning of another token.
		if( this.isAlpha(char) ){
			return this.readIdentifier();
		}
		if( this.isNumber(char) ){
			return this.readNumber();
		}
		if( char === this.quote ){
			return this.readQuote();
		}
		
		throw Error('Token error at ' + this.pos);
	},

	reset: function(){
		this.index = 0;
	},

	parse: function(){
		this.reset();

		var tokens = [], token;

		while( token = this.token() ){
			tokens.push(token);
		}

		return tokens;
	}
};