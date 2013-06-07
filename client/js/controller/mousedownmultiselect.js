/* global */

Class.extend('controller', 'mousedownmultiselect', Class('controller').Node, {
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
	}
});
