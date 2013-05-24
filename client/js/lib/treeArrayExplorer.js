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



// à renommer TreeIterator, et TreeIterator on renommeras autrement

var TreeArrayExplorer = new Class({
	acceptDescendant: Function.TRUE,
	acceptNode: Function.TRUE,

	initialize: function(root){
		this.root = root;
		this.current = this.root;
	},

	isRoot: function(node){
		return node == this.root;
	},

	__getLastNode: function(node){
		var last = null;

		while( this.acceptDescendant(node) ){
			node = node.getLast();
			if( node ) last = node;
			else break;
		}

		return last;
	},

	first: function(){
		return this.rootView;
	},

	last: function(){
		return this.__getLastNode(this.rootView);
	},

	next: function(){
		var node = this.current, next;

		if( this.acceptDescendant(node) ){
			if( node.children.length ){
				this.current = node.children[0];
				return this.current;
			}
		}

		while( !this.isRoot(node) ){
			next = node.getNext();
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

		var prev = node.getPrev();

		if( prev ){
			this.current = this.__getLastNode(prev) || prev;
			return this.current;
		}

		this.current = node.parentNode;
		return this.current;
	}
});
