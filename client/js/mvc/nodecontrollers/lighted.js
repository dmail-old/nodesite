/* global NodeController */

NodeController.create('lighted', {
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
			if( view && (!this.view.hasClass('compact') || e.target == view.getDom('name')) ){
				view.light(e);
			}
			else if( this.lighted ) {
				this.lighted.unlight(e);
			}
		}
	}
});

NodeController.prototype.getLighted = function(){
	var controller = this.getController('lighted');
	return controller ? controller.lighted : null;
};
