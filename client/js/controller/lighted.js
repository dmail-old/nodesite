/*

-- add lighted class if ---

a view emit 'light'
a view emit 'mouseover'

and store the view in this.lighted

-- remove lighted class if ---

a view emit 'mouseout' and no controlled view is the relatedTarget
an other view get lighted class
a view emit 'unlight'

*/

NS.Controller.define('lighted', {
	lighted: null,
	state: 'lighted',
	viewListeners: {
		'mouseover': function(e){
			var view = e.target;

			// when light only occur on the name element
			if( view != this && this.view.hasClass('compact') && e.args[0].target != view.getDom('name') ){
				view = this;
			}

			view.bubble('light', e.args);
		},

		'mouseout': function(e){
			// when the mouse go very fast out of the view mouseover event is'nt fired
			// on other view (event the parent view)
			// but we can check the relatedTarget to see if the mouse go out of all view
			var view = NS.View.cast(e.relatedTarget);

			// need the contains method in childrenInterface
			if( !this.view.contains(view) ){
				this.unsetLighted(this.lighted, e);
			}
		},

		'light': function(e){
			var view = e.target;

			if( view.light ){
				this.setLighted(view, e.args[0]);
			}
			else{
				this.unsetLighted(this.lighted, e.args[0]);
			}
		},

		'unlight': function(e){
			this.unsetLighted(this.lighted, e.args[0]);
		},

		'destroy': function(e){
			if( e.target == this.lighted ) this.lighted = null;
		}
	},

	setLighted: function(view, e){
		if( view && !view.hasClass(this.state) ){
			this.unsetLighted(this.lighted, e);
			this.lighted = view;
			view.addClass(this.state);
		}
	},

	unsetLighted: function(view, e){
		if( view && view.hasClass(this.state) ){
			view.removeClass(this.state);
			this.lighted = null;
		}
	}
});
