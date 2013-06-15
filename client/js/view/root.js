/* global */

var exports = {
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
};

exports = NS.TreeView.extend(exports);
NS.RootTreeView = exports;
