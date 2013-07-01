NS.NodeTraversal = {
	nextSibling: function(fn, bind, includeSelf){
		var node = includeSelf ? this : this.nextSibling;

		while( node !== null ){
			if( fn.call(bind, node) === NS.Filter.ACCEPT ) return node;
			node = node.nextSibling;
		}

		return null;
	},

	previousSibling: function(fn, bind, includeSelf){
		var node = includeSelf ? this : this.previousSibling;

		while( node !== null ){
			if( fn.call(bind, node) === NS.Filter.ACCEPT ) return node;
			node = node.previousSibling;
		}

		return null;
	},

	sibling: function(fn, bind){
		var node;

		node = this;
		while( node = node.nextSibling ){
			if( fn.call(bind, node) === NS.Filter.ACCEPT ) return node;
		}
		node = this;
		while( node = node.previousSibling ){
			if( fn.call(bind, node) === NS.Filter.ACCEPT ) return node;
		}

		return null;
	},

	firstChild: function(fn, bind){

		if( this.firstChild ){
			return NS.NodeTraversal.nextSibling.call(this.firstChild, fn, bind, true);
		}

		return null;
	},

	lastChild: function(fn, bind){

		if( this.lastChild ){
			return NS.NodeTraversal.previousSibling.call(this.lastChild, fn, bind, true);
		}

		return null;
	},

	parent: function(fn, bind){
		var node = this;

		while(node = node.parentNode){
			if( fn.call(bind, node) === NS.Filter.ACCEPT ) return node;
		}

		return null;
	},

	next: function(fn, bind, root){
		var node = this, result;

		while(true){
			while( node.firstChild ){
				node = node.firstChild;
				result = fn.call(bind, node);
				if( result === NS.Filter.ACCEPT ) return node;
				if( result === NS.Filter.REJECT ) break;
			}

			while( true ){
				if( node.nextSibling ){
					node = node.nextSibling;
					result = fn.call(bind, node);
					if( result === NS.Filter.ACCEPT ) return node;
					if( result === NS.Filter.REJECT ) continue;
					break;
				}
				else{
					node = node.parentNode;
					if( node === null || node === root ) return null;
				}
			}
		}

		return null;
	},

	previous: function(fn, bind, root){
		var node = this, result;

		while(true){
			if( node.previousSibling ){
				node = node.previousSibling;
				result = fn.call(bind, node);

				if( result != NS.Filter.REJECT ){
					while( node.lastChild ){
						node = node.lastChild;
						result = fn.call(bind, node);
						if( result === NS.Filter.REJECT ) break;
					}

					if( result === NS.Filter.ACCEPT ) return node;
				}
			}

			node = node.parentNode;
			if( node === null || node === root ) return null;
			if( fn.call(bind, node) === NS.Filter.ACCEPT ) return node;
		}

		return null;
	},

	first: function(){
		return NS.NodeTraversal.next.apply(this, arguments);
	},

	last: function(fn, bind){
		var node = this;

		while( node.lastChild ){
			node = node.lastChild;
		}

		if( fn.call(bind, node) === NS.Filter.ACCEPT ) return node;

		return NS.NodeTraversal.previous.call(node, fn, bind, this);
	}
};
