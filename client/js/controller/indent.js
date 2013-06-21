/*
indent subview of the controlled view
*/

NS.Controller.define('indent', {
	viewListeners: {
		'insertElement': function(e){
			var view = e.target, padding;

			if( view && view != this.view ){
				padding = this.padding * this.getLevel(view);
				view.getDom('div').style.paddingLeft = padding + 'px';
			}
		}
	},
	padding: 18,

	getLevel: function(view){
		var level = -1;

		while(view != this.view){
			level++;
			view = view.parentNode;
		}

		return level;
	}
});
