/*

When something that can change the width of the controller view occurs on subviews
call adapt on the controlled view

*/


NS.Controller.define('adapt', {
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
