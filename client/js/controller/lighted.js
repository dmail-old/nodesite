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

			view.light(e);
		},

		'mouseout': function(e){
			// when the mouse go very fast out of the view mouseover event is'nt fired
			// on other view (event the parent view)
			// but we can check the relatedTarget to see if the mouse go out of all view
			var view = NS.View.cast(e.relatedTarget);

			if( !view ){
				this.unsetLighted(this.lighted, e);
			}
		},

		'light': function(e){
			if( e.target == this ){
				this.unsetLighted(this.lighted, e.args[0]);
			}
			else{
				this.setLighted(e.target, e.args[0]);
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
