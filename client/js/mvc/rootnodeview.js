/* global View, NodeView */

/*

la class 'tree' deviendras surement la classe 'root'
la classe 'tree' serviras à mettre des styles spéciaux

il est encore possible de recevoir RootNodeView comme premier argument pour les events
ce qui est logique et normal
mais faut éviter d'appeller des fonctions comme light et select sur root

*/

var RootNodeView = new Class({
	Extends: NodeView,
	tagName: 'ul',

	className: 'tree line',
	attributes: {
		'tabindex': 0,
	},

	getClassName: View.prototype.getClassName,
	getHTML: View.prototype.getHTML,

	getChildrenElement: function(){
		return this.element;
	},

	getChildConstructor: function(){
		return NodeView;
	}
});
