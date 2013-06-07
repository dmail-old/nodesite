/* global Controller */

Controller.extend('mousedownselect', {
	Implements: Controller.Node,
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
	}
});
