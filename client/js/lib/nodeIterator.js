NS.NodeIterator = {
	root: null,
	current: null,
	filter: null,
	bind: null,

	constructor: function(root, filter, bind){
		this.root = root;
		this.current = root;
		this.filter = filter;
		this.bind = bind;
	},

	filterNode: function(node){
		if( this.filter ){
			return this.filter.call(this.bind, node);
		}
		return NS.Filter.ACCEPT;
	},

	next: function(node){
		var result;

		while(true){
			while( node.firstChild ){
				node = node.firstChild;
				result = this.filterNode(node);
				if( result == NS.Filter.ACCEPT ) return node;
				if( result == NS.Filter.REJECT ) break;
			}

			while( true ){
				if( node.nextSibling ){
					node = node.nextSibling;
					result = this.filterNode(node);
					if( result == NS.Filter.ACCEPT ) return node;
					if( result == NS.Filter.REJECT ) continue;
					if( result == NS.Filter.SKIP ) break;
				}
				else{
					node = node.parentNode;
					if( node == null || node == this.root ) return null;
				}
			}
		}

		return null;
	},

	prev: function(node){
		var current = node, prev, last, result;

		while(true){
			if( node.previousSibling ){
				node = node.previousSibling;
				result = this.filterNode(node);

				if( result != NS.Filter.REJECT ){
					while( node.lastChild ){
						node = node.lastChild;
						result = this.filterNode(node);
						if( result == NS.Filter.REJECT ) break;
					}

					if( result == NS.Filter.ACCEPT ) return node;
				}
			}

			node = node.parentNode;
			if( node == null ) return null;
			if( node == this.root ) return null;
			if( this.filterNode(node) == NS.Filter.ACCEPT ) return node;
		}

		return null;
	},

	first: function(node){
		return this.next(node);
	},

	last: function(node){
		var result;

		while( node.lastChild ){
			node = node.lastChild;
			result = this.filterNode(node);
			if( result == NS.Filter.REJECT ) break;
		}

		if( result == NS.Filter.ACCEPT ) return node;

		return this.prev(node);
	},

	nextNode: function(){
		var next = this.next(this.current);

		if( next ){
			this.current = next;
		}

		return next ? next.element : next;
	},

	previousNode: function(){
		var prev = this.prev(this.current);

		if( prev ){
			this.current = prev;
		}

		return prev ? prev.element : prev;
	},

	firstNode: function(){
		var first = this.first(this.root);

		if( first ){
			this.current = first;
		}

		return first ? first.element : first;
	},

	lastNode: function(){
		var last = this.last(this.root);

		if( last ){
			this.current = last;
		}

		return last ? last.element : last;
	}
};
