/* global ViewController, View */

var ViewControllerLighted = new Class({
	Extends: ViewController,
	handlers: {
		'mouseover': function(e){
			var view = View(e);

			if( view ){
				if( !view.light ) view = null;
				// when light only occur on the name element
				else if( this.view.element.hasClass('compact') && e.target != view.getDom('name') ) view = null;
			}

			if( view ){
				view.light(e);
			}
			else if( this.lighted ) {
				this.lighted.unlight(e);
			}
		},

		'view:light': function(e){
			if( this.lighted ) this.lighted.unlight(e);
			this.lighted = View(e);
		},

		'view:unlight': function(e){
			delete this.lighted;
		}
	}
});
