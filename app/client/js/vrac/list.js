NS.List = Array.prototype.create({
	create: function(){
		if( arguments.length > 0 ) this.push.apply(this, arguments);
	},

	clear: function(){
		this.length = 0;
	}
});
