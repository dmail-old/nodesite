var exports = {
	constructor: function(){
		if( arguments.length ) this.push.apply(this, arguments);
	},

	clear: function(){
		this.length = 0;
	}
};

exports = Array.prototype.extend(exports);
NS.List = exports;
