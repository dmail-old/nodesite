/* global View, NodeView, TreeStructure, TreeTraversal, TreeFinder */

/*

la class 'tree' deviendras surement la classe 'root'
la classe 'tree' serviras à mettre des styles spéciaux

*/

View.define('rootnode', {
	Implements: [TreeStructure, TreeTraversal, TreeFinder],
	tagName: 'ul',
	className: 'root',
	attributes: {
		'tabindex': 0,
	},

	constructor: function NodeView(){
		this.initChildren();
		View.prototype.constructor.call(this);
	},

	oninsertchild: function(child){
		if( this.element ){
			child.insertElement(this.element, child.getNextSibling(), true);
		}
	},

	onremovechild: function(child){
		child.removeElement();
	},

	getChildConstructor: function(){
		return View.views.node;
	}
});
