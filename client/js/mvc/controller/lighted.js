/* global Controller */

Controller.define('lighted', {
	Implements: Controller.Node,
	events: {
		'view:light': function(view, e){
			if( this.lighted ) this.lighted.unlight(e);
			this.lighted = view;
		},

		'view:unlight': function(){
			delete this.lighted;
		},

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
