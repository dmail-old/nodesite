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

function getLastNode

// à renommer TreeIterator, et TreeIterator on renommeras autrement

var TreeArrayExplorer = new Class({
	acceptDescendant: Function.TRUE,
	acceptNode: Function.TRUE,

	initialize: function(root){
		this.root = root;
		this.current = this.root;
	},

	first: function(){
		return this.rootView;
	},

	last: function(){

	},

	next: function(){
		var node = this.current;

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
				return next;
			}
		}

		return null;
	},

	prev: function(){
		var node = this.current;

		if( this.isRoot(node) ) return null;

		var prev = node.getPrev(), last = null;
		if( prev ){
			last = prev;
			while( this.acceptDescendant(last) ){
				last = last.getLast();
			}
		}

		this.current = node.parentNode;
		return this.current;
	},

	isRoot: function(){
		return this.parentNode == null;
	},

	firstNode: function(){
		var node = this, result;

		while( this.acceptDescendant(node) ){
			node = node.children[0];
			if( !node ) break;
			result = this.acceptNode(node);
			if( result === true ) return node;
			else if( result === false ) break;
			else if( result == 'skip' ) continue;
		}

		return null;
	},

	lastNode: function(){
		var node = this, last = null, result;

		while( this.acceptDescendant(node) ){
			node = node.getLast();
			if( !node ) break;
			result = this.acceptNode(node);
			// when a lastChild is accepted it is considered the lastNode until a deeper lastChild is accepted
			if( result === true ) last = node;
			else if( result === false ) break;
			else if( result == 'skip' ) continue;
		}

		return last;
	},

	prevNode: function(){
		var node = this, prev, last, result;

		while( !node.isRoot() ){
			// the previous sibling
			while( prev = node.getPrev() ){
				node = prev;
				// if we accept that sibling, try to return his lastNode else return the sibling
				if( this.acceptNode(node) === true ){
					return node.lastNode() || node;
				}
			}
			if( node.isRoot() ) break;
			// else try to return the parentNode
			node = node.parentNode;
			if( this.acceptNode(node) === true ){
				return node;
			}
		}

		return null;
	},

	nextSkippingChildren: function(){
		var node = this, next;

		while( !node.isRoot() ){
			next = node.getNext();
			if( next ) return next;
			node = node.parentNode;
		}

		return null;
	},

	nextNode: function(){
		var node = this, first, next, result = true;

		while( true ){
			// we dont iterate over the node if he was previously refused (skipped is ok)
			if( result !== false ){
				first = node.firstNode();
				if( first ) return first;
			}

			// firsNode refused, try to return the next sibling, the deeper first
			next = node.nextSkippingChildren();
			if( next ){
				node = next;
				result = this.acceptNode(node);
				if( result === true ) return node;
			}
			else{
				break;
			}
		}

		return null;
	}
});
