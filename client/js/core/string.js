String.implement = Object.implement.bind(String);
String.complement = Object.complement.bind(String);

String.SPACE = ' ';
String.EMPTY = '';

Function.UPPERCASE = function(a){ return a.toUpperCase(); };
Function.ESCAPE = function(a){ return '\\' + a; };

RegExp.WORD_GLOBAL = /\b[a-z]/g;
RegExp.SPECIAL_GLOBAL = /([-.*+?^${}()|[\]\/\\])/g;
RegExp.BLANK_GLOBAL = /\s+/g;
RegExp.BLANK_TRAILING_GLOBAL = /^\s+|\s+$/g;

String.complement({
	toInt: function(base){
		return parseInt(this, base || 10);
	},

	startsWith: function(pattern){
		return this.lastIndexOf(pattern, 0) === 0;
	},

	endsWith: function(pattern){
		var index = this.length - pattern.length;
		return index >= 0 && this.indexOf(pattern, index) === index;
	},

	contains: function(pattern, index){
		return this.indexOf(pattern, index) !== -1;
	},

	capitalize: function(){
		return String(this).replace(RegExp.WORD_GLOBAL, Function.UPPERCASE);
	},

	escapeRegExp: function(){
		return this.replace(RegExp.SPECIAL_GLOBAL, Function.ESCAPE);
	},

	singleSpace: function(){
		return String(this).replace(RegExp.BLANK_GLOBAL, String.SPACE);
	},

	trim: function(){
		return String(this).replace(RegExp.BLANK_TRAILING_GLOBAL, String.EMPTY);
	},

	clean: function(){
		return String.prototype.singleSpace.call(this).trim();
	}
});