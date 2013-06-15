/* global */

NS.Adapt = require('../controller.js').extend({
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
