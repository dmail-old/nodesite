window.List = new Class({
	Extends: Array,

	constructor: function(){
		this.push.apply(this, arguments);
	}
});
