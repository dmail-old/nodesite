String.implement = Object.implement.bind(String);
String.complement = Object.complement.bind(String);

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

	trim: function(){
		return String(this).replace(/^\s+|\s+$/g, '');
	},

	singleSpace: function(){
		return String(this).replace(/\s+/g, ' ');
	},

	clean: function(){
		return String.prototype.singleSpace.call(this).trim();
	},

	capitalize: function(){
		return String(this).replace(/\b[a-z]/g, function(match){
			return match.toUpperCase();
		});
	},

	escapeRegExp: function(){
		return this.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
	}
});
