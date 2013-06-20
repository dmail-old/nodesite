NS.Adapt = NS.Controller.extend({
	modelListeners: {
		'change:name': 'adapt'
	},
	viewListeners: {
		'insertElement': 'adapt',
		'removeElement': 'adapt',
		'open': 'adapt'
	},

	adapt: function(){
		this.view.adapt();
	}
});
