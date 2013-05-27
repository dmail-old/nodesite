/* global Controller, View, TreeView */

var ControllerSelection = new Class({
	Extends: Controller,

	events: {
		mousedown: function(view, e){
			console.log('mousedown single')

			if( view ){
				view.select(e);
			}
			else if( this.selected ){
				this.selected.unselect(e);
			}
		},

		'view:select': function(view, e){
			if( this.selected ) this.selected.unselect(e);
			this.selected = view;
		},

		'view:unselect': function(){
			delete this.selected;
		}
	}
});


View.defineController(TreeView, 'selection', {
	constructor: ControllerSelection
});

TreeView.prototype.addController('selection');
