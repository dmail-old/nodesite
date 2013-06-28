NS.List = Array.prototype.extend({
	create: function(){
		if( arguments.length > 0 ) this.push.apply(this, arguments);
	},

	clear: function(){
		this.length = 0;
	}
});
