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
		var root = this, node = includeSelf ? this : this.firstChild, result, first, next;

		while( node != null ){
			result = fn.call(bind, node);
			if( result == NS.Filter.ACCEPT ) break;
			if( result != NS.Filter.SKIP ){
				first = node.firstChild;
				if( first ){
					node = first;
					continue;
				}
			}

			next = node.nextSibling;
			while(next == null){
				node = node.parentNode;
				if( node == root ) break;
				next = node.nextSibling;
			}
			node = next;
		}

		return node;
	},

	crossNodeReverse: function(fn, bind, includeSelf){
		var root = this, node = this, result, prev, last;

		while(node != null){

			prev = node.previousSibling;
			if( prev && fn.call(bind, prev) == NS.Filter.ACCEPT ){
				node = prev;

				while( last = node.lastChild){
					if( fn.call(bind, last) != NS.Filter.ACCEPT ) break;
					node = last;
				}

				/*
				ici node vaut véritablement le noeud qui nous intérêsse
				cad le précédent noeud qui passe filter
				pour ça que le système de fonction qui filtre fonctionne pas
				avec les structures arborescente
				*/
			}
			else{
				node = node.parentNode;
				if( node == root ) break;
				if( !node ) break;

				if( fn.call(bind, node) == NS.Filter.ACCEPT ) break;
			}
		}
	}
};

/*
Object.defineProperties(childrenInterface, {
	'lastNode': {
		'get': function(){
			var node = this, last = null;

			while( node = node.lastChild ){
				last = node;
			}

			return last;
		}
	}
});
*/
