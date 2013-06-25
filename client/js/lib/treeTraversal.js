NS.treeTraversal = {
	crossPrevSibling: function(fn, bind, includeSelf){
		var node = includeSelf ? this : this.previousSibling;

		while( node != null ){
			if( fn.call(bind, node) == NS.Filter.ACCEPT ) break;
			node = node.previousSibling;
		}

		return this;
	},

	crossNextSibling: function(fn, bind, includeSelf){
		var node = includeSelf ? this : this.nextSibling;

		while( node != null ){
			if( fn.call(bind, node) == NS.Filter.ACCEPT ) break;
			node = node.nextSibling;
		}

		return this;
	},

	crossSibling: function(fn, bind){
		var node;

		node = this;
		while( node = node.nextSibling ){
			if( fn.call(bind, node) == NS.Filter.ACCEPT ) return this;
		}
		node = this;
		while( node = node.previousSibling ){
			if( fn.call(bind, node) == NS.Filter.ACCEPT ) return this;
		}

		return this;
	},

	crossChild: function(fn, bind){
		var node = this.firstChild;

		if( node ){
			this.crossNextSibling.call(node, fn, bind, true);
		}

		return this;
	},

	crossReverse: function(fn, bind){
		var node = this.lastChild;

		if( node ){
			this.crossPrevSibling.call(node, fn, bind, true);
		}

		return this;
	},

	crossParent: function(fn, bind){
		var node = this;

		while(node = node.parentNode){
			if( fn.call(bind, node) === NS.Filter.ACCEPT ) break;
		}

		return this;
	},

	crossNode: function(fn, bind, includeSelf){
		var root = this, node = includeSelf ? this : this.firstChild, result;

		while( node != null ){
			result = fn.call(bind, node);
			if( result == NS.Filter.ACCEPT ) break;
			if( result != NS.Filter.SKIP ){
				if( node.firstChild ){
					node = node.firstChild;
					continue;
				}
			}

			while(true){
				if( node.nextSibling ){
					node = node.nextSibling;
					break;
				}
				else{
					node = node.parentNode;
					if( node == null || node == root ) return this;
				}
			}
		}

		return this;
	}
};
