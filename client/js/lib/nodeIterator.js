NS.NodeIterator = {
	root: null,
	filter: null, // object having a acceptNode method
	current: null,

	create: function(root, filter){
		this.root = root;
		this.current = root;
		this.filter = filter;
	},

	/*
	allow to iterate in a direction (next, prev, nextSibling, prevSibling)
	and loop from the beggining/end to get the first node for wich fn returns true
	*/
	iterate: function(fn, bind, direction, loop){
		var node = null, start = this.current;

		while( node = this[direction]() ){
			if( fn.call(bind, node) == NS.Filter.ACCEPT ){
				return node;
			}
		}

		if( loop ){

			if( direction == 'next' ){
				this.current = this.root;
				node = this.first();
			}
			else if( direction == 'previous' ){
				this.current = this.root;
				node = this.last();
			}
			else if( direction == 'nextSibling' ){
				node = start.parentNode ? start.parentNode.firstChild : null;
			}
			else if( direction == 'previousSibling' ){
				node = start.parentNode ? start.parentNode.lastChild : null;
			}

			while( node && node != start ){
				if( fn.call(bind, node) === NS.Filter.ACCEPT ){
					return node;
				}
				node = this[direction]();
			}
		}

		this.current = start;
		return null;
	}
};

Object.eachPair(NS.NodeTraversal, function(name){

	// ne sort pas de la racine
	if( name == 'previous' || name == 'next' ){
		NS.NodeIterator[name] = function(){
			var node = NS.NodeTraversal[name].call(this.current, this.filter.acceptNode, this.filter, this.root);
			if( node ){
				this.current = node;
			}
			return node;
		};
	}
	else{
		NS.NodeIterator[name] = function(){
			var node = NS.NodeTraversal[name].call(this.current, this.filter.acceptNode, this.filter);
			if( node ){
				this.current = node;
			}
			return node;
		};
	}

});