NS.IndentTreeController = NS.TreeController.extend({
	name: 'IndentTreeController',
	events: {
		'view:insertElement': function(e){
			var view = e.target;
			var padding = this.padding * this.getLevel(view);

			view.getDom('div').style.paddingLeft = padding + 'px';
		}
	},
	padding: 18,

	getLevel: function(view){
		var level = 0, parent = view.parentNode;
		while(parent){
			level++;
			parent = parent.parentNode;
		}
		return level - 1;
	}
});
