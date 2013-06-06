/* global Controller */

Controller.extends('lighted', {
	Implements: Controller.Node,
	events: {
		'mouseover': function(view, e){
			// when light only occur on the name element
			if( view && view != this.view && (!this.view.hasClass('compact') || e.target == view.getDom('name')) ){
				view.light(e);
			}
			else if( this.view.lighted ) {
				this.view.lighted.unlight(e);
			}
		}
	}
});