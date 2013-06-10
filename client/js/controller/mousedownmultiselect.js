/* global */

NS.MousedownmultiselectTreeController = NS.TreeController.extend({
	name: 'MousedownmultiselectTreeController',
	requires: 'MultiSelectionController',
	events: {
		'mousedown': function(view, e){
			if( view && view != this.view ){
				this.MultiSelectionController.add(view, e);
			}
			else{
				this.MultiSelectionController.unselectAll(e);
			}
		},

		'click': function(view, e){
			if( view && view != this.view ){
				this.MultiSelectionController.unselectOther(view, e);
			}
			else{
				this.MultiSelectionController.unselectAll(e);
			}
		},

		'keydown': function(view, e){
			if( e.control && e.key == 'a' ){
				this.MultiSelectionController.selectAll(e);
			}
		}
	},

	setElement: function(element){
		if( element ) element.addClass('unselectable');
		return NS.TreeController.setElement.call(this, element);
	},

	unsetElement: function(){
		if( this.element ) this.element.removeClass('unselectable');
		return NS.TreeController.unsetElement.call(this);
	}
});
