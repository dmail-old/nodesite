/* global */

Item.extend('view.tree', 'root', {
	tagName: 'ul',
	className: 'root',
	attributes: {
		'tabindex': 0,
	},

	getChildItemName: function(){
		return 'view.tree.node';
	},

	getChildrenElement: function(){
		return this.element;
	},
});
