/* global Controller */

Controller.extends('selection', {
	Implements: Controller.Node,
	events: {
		mousedown: function(view, e){
			if( view && view != this.view ){
				view.select(e);
			}
			else if( this.view.selected ){
				this.view.selected.unselect(e);
			}
		}
	}
});
