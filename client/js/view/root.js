/* global */

NS.RootTreeView = require('./tree.js').extend({
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
