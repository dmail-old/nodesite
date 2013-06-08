/* global */

Class.extend('controller', 'adapt', {
	events: {
		'view:change:name': 'adapt',
		'view:insertElement': 'adapt',
		'view:removeElement': 'adapt',
		'view:open': 'adapt'
	},

	adapt: function(){
		this.view.adapt();
	}
});