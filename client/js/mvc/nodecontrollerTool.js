/* global Controller, NodeController */

var NodeControllerTool = new Class(NodeController, {
	events: {
		'mousedown': function(view, e){
			if( e.target.hasClass('tool') ){
				view.toggleState('expanded', e);
			}
		},

		'dblclick': function(view, e){
			// tention ici y'a conflit avec le futur menu contextuel
			// qui prendras le pas sur ce dblclick
			if( view && !e.target.hasClass('tool') ){
				view.toggleState('expanded', e);
			}
		}
	}
});

Controller.register('tool', NodeControllerTool);
