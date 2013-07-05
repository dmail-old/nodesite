/*

name: TokenList

description: TokenList is used to manipulate a list of string separated by a space (similar to native classList)

*/

NS.TokenList =  NS.List.extend({
	constructor: function(string){
		if( string ){
			var trimmed = String.prototype.trim.call(string);
			if( trimmed ) NS.List.constructor.apply(this, trimmed.split(RegExp.SPACE));
		}
		return this;
	},

	indexOf: function(token, index){
		if( token === '' ) throw new Error('SYNTAX_ERR', 'An invalid or illegal string was specified');
		if( RegExp.BLANK.test(token) ) throw new Error('INVALID_CHARACTER_ERR', 'String contains an invalid character');

		return Array.prototype.indexOf.call(this, token, index);
	},

	contains: function(token, index){
		return this.indexOf(token, index) !== -1;
	},

	update: Function.EMPTY,

	add: function(){
		var tokens = arguments, i = 0, j = tokens.length, token, updated = false;

		for(;i<j;i++){
			token = String(tokens[i]);
			if( !this.contains(token) ){
				this.push(token);
				updated = true;
			}
		}
		if( updated ) this.update();

		return this;
	},

	remove: function(){
		var tokens = arguments, i = 0, j = tokens.length, token, updated = false, index;

		for(;i<j;i++){
			token = String(tokens[i]);
			index = this.indexOf(token);
			if( index !== -1 ){
				this.splice(index, 1);
				updated = true;
			}
		}
		if( updated ) this.update();

		return this;
	},

	toggle: function(token, force){
		if( typeof force === undefined ) force = !this.contains(token);
		return force ? this.add(token) : this.remove(token);
	},

	toString: function(){
		return this.join(' ');
	}
});
