Class.extend(Array, 'list', {
	constructor: function(){
		this.push.apply(this, arguments);
	}
});
