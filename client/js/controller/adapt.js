/* global */

var exports = {
	events: {
		'view:change:name': 'adapt',
		'view:insertElement': 'adapt',
		'view:removeElement': 'adapt',
		'view:open': 'adapt'
	},

	adapt: function(){
		this.view.adapt();
	}
};

exports = NS.Controller.extend(exports);
NS.Adapt = exports;
