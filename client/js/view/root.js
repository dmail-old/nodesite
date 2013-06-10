/* global */

Item.extend('view.tree', 'root', {
	tagName: 'ul',
	className: 'root',
	attributes: {
		'tabindex': 0,
	},

	getChildItem: function(){
		return Item('view.tree.node');
	},

	getChildrenElement: function(){
		return this.element;
	},
});
