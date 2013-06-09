/* global */

Item.extend('controller.tree', 'mousedownselect', {
	requires: 'selected',
	events: {
		mousedown: function(view, e){
			if( view && view != this.view ){
				this.selected.add(view, e);
			}
			else{
				this.selected.remove(this.selected.current, e);
			}
		}
	},

	setElement: function(element){
		if( element ) element.addClass('unselectable');
		return Item('controller.tree').setElement.call(this, element);
	},

	unsetElement: function(){
		if( this.element ) this.element.removeClass('unselectable');
		return Item('controller.tree').unsetElement.call(this);
	}
});
