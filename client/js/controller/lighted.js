/* global Controller */

Controller.extends('lighted', {
	Implements: Controller.Node,
	events: {
		'mouseover': function(view, e){
			// when light only occur on the name element
			if( view && view != this.view && (!this.view.hasClass('compact') || e.target == view.getDom('name')) ){
				view.light(e);
			}
			else if( this.lighted ) {
				this.lighted.unlight(e);
			}
		}
	}
});

Controller.prototype.getLighted = function(){
	var controller = this.getController('lighted');
	return controller ? controller.lighted : null;
};
