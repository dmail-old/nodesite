var Lexer = require('lexer');
var RouteToken = Lexer.Token.extend({
	named: false,
	splat: false
});

var RouteLexer = Lexer.extend({
	__name__: 'RouteLexer',
	specials: '/?&',	
	Token: RouteToken,

	writeToken: function(token, char){
		// a named token
		if( char == ':' ){
			token.named = true;
			return this.CONTINUE;
		}

		// a splat token
		if( char == '*' ){
			token.splat = true;
			return this.CONTINUE;
		}

		if( char == '=' ){
			token.paramValue = true;
			return this.CONTINUE;
		}

		// begining of a token
		if( this.isAlphaNum(char) ){
			token.index = this.index;
			token.value = char + this.readAlphaNum(this.index + 1);
			return this.BREAK;
		}
	}
});

module.exports = RouteLexer;