// we are not really heriting from NS.base, because we herit from Array.prototype
// but we add NS.base methods to the list object

NS.List = Object.append(Object.create(Array.prototype), NS.Item, {
	constructor: function(){
		if( arguments.length ) this.push.apply(this, arguments);
	},

	clear: function(){
		this.length = 0;
	}
});
