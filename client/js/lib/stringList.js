/*

name: StringList

description: StringList is used to manipulate a list of string separated by a space (similar to native classList)

*/

var exports = NS.StringList =  NS.List.extend(exports, {
	constructor: function(string){
		if( string ){
			var trimmed = String.prototype.trim.call(string);
			if( trimmed ) NS.List.constructor.apply(this, trimmed.split(RegExp.SPACE));
		}
		return this;
	},

	indexOf: function(token, index){
		if( token === '' ) throw new Error('SYNTAX_ERR', 'An invalid or illegal string was specified');
		if( RegExp.SPACE.test(token) ) throw new Error('INVALID_CHARACTER_ERR', 'String contains an invalid character');

		return Array.prototype.indexOf.call(this, token, index);
	},

	contains: function(token, index){
		return this.indexOf(token, index) !== -1;
	},

	update: Function.NULL,

	add: function(token){
		if( !this.contains(token) ){
			this.push(token);
			this.update();
		}
		return this;
	},

	remove: function(token){
		var index = this.indexOf(token);
		if( index !== -1 ){
			this.splice(index, 1);
			this.update();
		}
		return this;
	},

	toggle: function(token){
		return this.contains(token) ? this.remove(token) : this.add(token);
	},

	toString: function(){
		return this.join(' ');
	}
});
