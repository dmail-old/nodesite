/* global Controller, NodeController */

var NodeControllerIndent = new Class({
	Extends: NodeController,
	events: {
		'view:insertElement': function(view){
			// when the background of the node take full width we have to set a padding manually here
			var level = view.getLevel();
			if( this.view.hasClass('hideRoot') ) level--;
			view.getDom('div').style.paddingLeft = this.padding * level + 'px';
		}
	},
	padding: 18
});

Controller.register('indent', NodeControllerIndent);
