var List = Array.prototype.extend({
	constructor: function(){
		if( arguments.length ) this.push.apply(this, arguments);
	},

	clear: function(){
		this.length = 0;
	}
});

module.exports = List;
