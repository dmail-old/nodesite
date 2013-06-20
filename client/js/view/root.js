/* global */

NS.RootTreeView = NS.TreeView.extend({
	tagName: 'ul',
	className: 'root',
	attributes: {
		'tabindex': 0,
	},

	getChildItem: function(){
		return NS.NodeTreeView;
	},

	getChildrenElement: function(){
		return this.element;
	},
});
