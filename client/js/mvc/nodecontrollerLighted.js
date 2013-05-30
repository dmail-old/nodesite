/* global Controller, NodeController */

var NodeControllerLighted = new Class(NodeController, {
	events: {
		'view:light': function(view, e){
			if( this.lighted ) this.lighted.unlight(e);
			this.lighted = view;
		},

		'view:unlight': function(){
			delete this.lighted;
		},

		'mouseover': function(view, e){
			if( view ){
				// when light only occur on the name element
				if( this.view.hasClass('compact') && e.target != view.getDom('name') ) view = null;
			}

			if( view && view.light ){
				view.light(e);
			}
			else if( this.lighted ) {
				this.lighted.unlight(e);
			}
		}
	}
});

Controller.register('lighted', NodeControllerLighted);
