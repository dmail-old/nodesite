window.List = new Class({
	Extends: Array,
	
	initialize: function(){
		this.push.apply(this, arguments);
	}
});