NS.MousedownmultiselectController = NS.Controller.extend({
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
		return NS.Controller.setElement.call(this, element);
	},

	unsetElement: function(){
		if( this.element ) this.element.removeClass('unselectable');
		return NS.Controller.unsetElement.call(this);
	}
});
