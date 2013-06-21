NS.Controller.define('focused', {
	focused: null,
	state: 'focused',
	viewListeners: {
		'focus': function(e){
			this.setFocused(e.target, e.args[0]);
		},

		'destroy': function(e){
			if( e.target == this.focused ) this.focused = null;
		}
	},

	setFocused: function(view, e){
		if( view && !view.hasClass(this.state) ){
			this.unsetFocused(this.focused, e);
			this.focused = view;
			view.addClass(this.state);
		}
	},

	unsetFocused: function(view, e){
		if( view && view.hasClass(this.state) ){
			view.removeClass(this.state);
			this.focused = null;
		}
	}
});
