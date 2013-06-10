/* global */

NS('controller.tree').extend('mouseoverlight', {
	requires: 'lighted',
	events: {
		'mouseover': function(view, e){
			// when light only occur on the name element
			if( view && view != this.view && (!this.view.hasClass('compact') || e.target == view.getDom('name')) ){
				this.lighted.add(view, e);
			}
			else{
				this.lighted.remove(this.lighted.current, e);
			}
		},

		'mouseout': function(view, e){
			// when the mouse go very fast out of the view
			// mouseover event is'nt fired on other view but we can check mouseout relatedTarget
			view = NS('view').cast(e.relatedTarget);
			if( !view ){
				this.lighted.remove(this.lighted.current, e);
			}
		}
	}
});
