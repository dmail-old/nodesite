/* global NodeController */

NodeController.create('tool', {
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
