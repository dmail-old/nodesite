/* global Controller */

Controller.extends('selection', {
	Implements: Controller.Node,
	events: {
		'view:select': function(view, e){
			var previous = this.selected;

			this.setSelected(view);
			if( previous ) previous.unselect(e);
		},

		'view:unselect': function(view){
			if( view == this.selected ) this.unsetSelected();
		},

		'view:leave': function(view){
			if( view == this.selected ) this.unsetSelected();
		},

		mousedown: function(view, e){
			if( view && view != this.view ){
				view.select(e);
			}
			else if( this.selected ){
				this.selected.unselect(e);
			}
		}
	},
	selected: null,

	setSelected: function(view){
		this.selected = view;
	},

	unsetSelected: function(){
		this.selected = null;
	}
});

Controller.prototype.getSelected = function(){
	var controller = this.getController('selection');
	return controller ? controller.selected : null;
};
