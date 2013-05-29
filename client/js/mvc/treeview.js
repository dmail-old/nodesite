/* global View, NodeView */

var TreeView = new Class({
	Extends: View,
	tagName: 'div',
	attributes: {
		'tabindex': 0,
		'class': 'tree line hideRoot'
	},

	initialize: function(){
		View.prototype.initialize.call(this);
		this.root = new NodeView(root);
	},

	insertElement: function(){
		View.prototype.insertElement.apply(this, arguments);

		var ul = this.element.appendChild(new Element('ul'));

		this.root.render();

		if( this.element.hasClass('hideRoot') ){
			this.root.insertChildren(ul);
		}
		else{
			this.root.insertElement(ul);
		}

		return this;
	}
});
