NS.List = Array.prototype.extend({
	constructor: function(){
		if( arguments.length > 0 ) this.push.apply(this, arguments);
	},

	clear: function(){
		this.length = 0;
	}
});
