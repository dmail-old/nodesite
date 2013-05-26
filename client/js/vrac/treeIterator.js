/*
inspired by treewalker and mostly by:
https://github.com/Krinkle/dom-TreeWalker-polyfill/blob/master/src/TreeWalker-polyfill.js

the main purpose of this class is to provide nextNode & prevNode to cross a tree structure.

it also allow to:
- ignore descendants based on acceptDescendant
- only getting node matching acceptNode

if a node doesn't match we have two choice:
return 'skip',  we dont reject the node descendants
return false, the node and all his descendant are rejected

TODO: instead of getLast, getPrev, use node.children[node.children.length-1] for example
because getLast is more expansive due to call to TreeFinder

ce que ej veux est plutot simple: je veux être capable de me ballader dans ma structure
avec des méthodes next, prev, first, last comme si la structure était un tableau

sauf que ce tableau filtre certains éléments (non expanded, hidden)

*/

var TreeIterator = new Class({
	initialize: function(root){
		this.root = root;
		this.current = this.root;
	},
	
	// helpers
	firstChild: function(node){
		return node.children.length === 0 ? null : node.children[0];
	},
	
	lastChild: function(node){
		return node.children.length === 0 ? null : node.children[node.children.length - 1];
	},
	
	lastNode: function(node){
		var last = null;

		while( node = this.lastChild(node) ){
			last = node;
		}

		return last;
	},
	
	nextSibling: function(node){
		var parent = node.parentNode, next = null;
		
		if( parent ){
			next = parent.children[parent.children.indexOf(node) + 1] || null;
		}
		
		return next;
	},
	
	prevSibling: function(node){
		var parent = node.parentNode, prev = null;
		
		if( parent ){
			prev = parent.children[parent.children.indexOf(node) - 1] || null;
		}
		
		return prev;	
	},

	isRoot: function(node){
		return node == this.root;
	},

	// core methods
	first: function(){
		return this.root;
	},

	last: function(){
		return this.lastNode(this.root);
	},
	
	next: function(){
		var node = this.current, next, first;
		
		var first = this.firstChild(node);
		if( first ){
			this.current = first;
			return this.current;
		}

		while( !this.isRoot(node) ){
			next = this.nextSibling(node);
			if( next ){
				this.current = next;
				return this.current;
			}
		}

		return null;
	},

	prev: function(){
		var node = this.current;

		if( this.isRoot(node) ) return null;

		var prev = this.prevSibling(node);

		if( prev ){
			this.current = this.lastNode(prev) || prev;
			return this.current;
		}

		this.current = node.parentNode;
		return this.current;
	}
});

// et voilà ce qu'il suffit de faire pour mon itérateur qui évite les noeuds hidden et non expanded
/*
var VisiblesIterator = new TreeIterator();
VisiblesIterator.lastChild = function(node){
	if( node.hasState('hidden') || !node.hasState('expanded') ) return null;
	return TreeIterator.prototype.lastChild.call(this, node);
};
VisiblesIterator.firstChild = function(node){
	if( node.hasState('hidden') || !node.hasState('expanded') ) return null;
	return TreeIterator.prototype.firstChild.call(this, node);
};
*/


