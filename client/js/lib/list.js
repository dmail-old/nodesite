Item.extend(Array.prototype, 'list', {
	constructor: function(){
		this.push.apply(this, arguments);
	}
});
