/* global Controller, View, TreeView */

var ControllerLighted = new Class({
	Extends: Controller,
	events: {
		'mouseover': function(view, e){
			if( view ){
				if( !view.light ) view = null;
				// when light only occur on the name element
				else if( this.view.hasClass('compact') && e.target != view.getDom('name') ) view = null;
			}

			if( view ){
				view.light(e);
			}
			else if( this.lighted ) {
				this.lighted.unlight(e);
			}
		},

		'view:light': function(view, e){
			if( this.lighted ) this.lighted.unlight(e);
			this.lighted = view;
		},

		'view:unlight': function(){
			delete this.lighted;
		}
	}
});

TreeView.prototype.controllers.push(ControllerLighted);
