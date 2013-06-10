/* global */

Item('controller.tree').extend('tool', {
	events: {
		'mousedown': function(view, e){
			if( view && view != this.view && e.target.hasClass('tool') ){
				view.toggleClass('expanded', e);
			}
		},

		'dblclick': function(view, e){
			// tention ici y'a conflit avec le futur menu contextuel
			// qui doit prendre le pas sur ce dblclick
			if( view && view != this.view && !e.target.hasClass('tool') ){
				view.toggleClass('expanded', e);
			}
		},

		'view:addclass:expanded': function(view, e){
			if( !view.getChildrenElement() ) view.renderChildren();
		}
	}
});
