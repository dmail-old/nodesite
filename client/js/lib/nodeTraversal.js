NS.NodeTraversal = {
	ACCEPT: true,
	REJECT: false,
	
	nextSibling: function(fn, bind, includeSelf){
		var node = includeSelf ? this : this.nextSibling;

		while( node !== null ){
			if( fn.call(bind, node) === this.ACCEPT ) return node;
			node = node.nextSibling;
		}

		return null;
	},

	previousSibling: function(fn, bind, includeSelf){
		var node = includeSelf ? this : this.previousSibling;

		while( node !== null ){
			if( fn.call(bind, node) === this.ACCEPT ) return node;
			node = node.previousSibling;
		}

		return null;
	},

	sibling: function(fn, bind, direction){
		var node = this;

		direction = direction || 'nextSibling';

		while( node = node[direction] ){
			if( fn.call(bind, node) === this.ACCEPT ) return node;
		}
		if( this.parentNode ){
			node = this.parentNode[direction == 'nextSibling' ? 'firstChild' : 'lastChild'];

			while( node != null && node != this ){
				if( fn.call(bind, node) === this.ACCEPT ) return node;
				node = node[direction];
			}
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
			if( fn.call(bind, node) === this.ACCEPT ) return node;
		}

		return null;
	},

	next: function(fn, bind, root){
		var node = this, result;

		while(true){
			while( node.firstChild ){
				node = node.firstChild;
				result = fn.call(bind, node);
				if( result === this.ACCEPT ) return node;
				if( result === this.REJECT ) break;
			}

			while( true ){
				if( node.nextSibling ){
					node = node.nextSibling;
					result = fn.call(bind, node);
					if( result === this.ACCEPT ) return node;
					if( result === this.REJECT ) continue;
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

				if( result != this.REJECT ){
					while( node.lastChild ){
						node = node.lastChild;
						result = fn.call(bind, node);
						if( result === this.REJECT ) break;
					}

					if( result === this.ACCEPT ) return node;
				}
			}

			node = node.parentNode;
			if( node === null || node === root ) return null;
			if( fn.call(bind, node) === this.ACCEPT ) return node;
		}

		return null;
	},

	first: function(fn, bind){
		return NS.NodeTraversal.next.call(this, fn, bind, this);
	},

	last: function(fn, bind){
		var node = this;

		while( node.lastChild ){
			node = node.lastChild;
		}

		if( fn.call(bind, node) === this.ACCEPT ) return node;

		return NS.NodeTraversal.previous.call(node, fn, bind, this);
	}
};

/*
// public API
NS.NodeTraversal = {};
Object.eachPair(NS.TraversalMethods, function(name, method){
	NS.NodeTraversal[name] = function(){
		if( arguments.length === 0 ) return method.call(this, console.log, console);
		else return method.apply(this, arguments);
	};
});
*/