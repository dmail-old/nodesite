/* global ViewController, View */

var ViewControllerSelection = new Class({
	Extends: ViewController,

	handlers: {
		'view:select': function(e){
			if( this.selected ) this.selected.unselect(e);
			this.selected = View(e);
		},

		'view:unselect': function(e){
			delete this.selected;
		}
	}
});
