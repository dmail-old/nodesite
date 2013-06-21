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
		'light': function(e){
			this.setLighted(e.target, e.args[0]);
		},

		'unlight': function(e){
			this.unsetLighted(e.target, e.args[0]);
		},

		'unlightAll': function(e){
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
