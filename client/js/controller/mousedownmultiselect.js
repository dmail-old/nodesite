/* global */

NS('controller.tree').extend('mousedownmultiselect', {
	requires: 'multiselection',
	events: {
		'mousedown': function(view, e){
			if( view && view != this.view ){
				this.multiselection.add(view, e);
			}
			else{
				this.multiselection.unselectAll(e);
			}
		},

		'click': function(view, e){
			if( view && view != this.view ){
				this.multiselection.unselectOther(view, e);
			}
			else{
				this.multiselection.unselectAll(e);
			}
		},

		'keydown': function(view, e){
			if( e.control && e.key == 'a' ){
				this.multiselection.selectAll(e);
			}
		}
	},

	setElement: function(element){
		if( element ) element.addClass('unselectable');
		return NS('controller.tree').setElement.call(this, element);
	},

	unsetElement: function(){
		if( this.element ) this.element.removeClass('unselectable');
		return NS('controller.tree').unsetElement.call(this);
	}
});
