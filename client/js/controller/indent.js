// indent subview of the controlled view

NS.IndentController = NS.Controller.extend({
	viewListeners: {
		'insertElement': function(e){
			var view = e.target;

			if( view && view != this.view ){
				var padding = this.padding * this.getLevel(view);
				view.getDom('div').style.paddingLeft = padding + 'px';
			}
		}
	},
	padding: 18,

	getLevel: function(view){
		var level = -2;

		while(view){
			level++;
			view = view.parentNode;
		}

		return level;
	}
});
