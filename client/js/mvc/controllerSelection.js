/* global Controller, View, TreeView */

var ControllerSelection = new Class({
	Extends: Controller,
	events: {
		'view:select': function(view, e){
			if( this.selected ) this.selected.unselect(e);
			this.selected = view;
		},

		'view:unselect': function(){
			delete this.selected;
		},

		mousedown: function(view, e){
			if( view ){
				view.select(e);
			}
			else if( this.selected ){
				this.selected.unselect(e);
			}
		}
	}
});

Controller.register('selection', ControllerSelection);
