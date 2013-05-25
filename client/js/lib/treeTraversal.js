window.TreeTraversal = {
	// call fn on every child of the element, returns true to break the loop
	cross: function(fn, bind){
		var children = this.children, i = 0, j = children.length;

		for(;i<j;i++){
			if( fn.call(bind, children[i], i) === true ) break;
		}

		return this;
	},

	// call fn on every descendant of the element, returns true to break the loop or 'continue' to ignore the descendant of the current element
	crossAll: function(fn, bind, includeSelf){
		function run(node){
			var ret = fn.call(bind, node);
			if( ret ) return ret != 'continue';
			node.cross(run);
		}

		if( includeSelf ) run(this); else this.cross(run);

		return this;
	},

	crossReverse: function(fn, bind){
		var children = this.children, i = children.length;

		while(i--){
			if( fn.call(bind, children[i], i) === true ) break;
		}

		return this;
	},

	// call fn on every parent of the element, return true to break the loop
	crossUp: function(fn, bind){
		var parent = this.parentNode, i = 0;

		while(parent){
			if( fn.call(bind, parent, i++) === true ) break;
			parent = parent.parentNode;
		}

		return this;
	},

	crossDirection: function(direction, fn, bind){
		var parent = this.parentNode, children, index;

		if( parent ){
			children = parent.children;
			index = Array.prototype.indexOf.call(children, this);
			Array.prototype.iterate.call(children, fn, direction, index, null, bind);
		}

		return this;
	},

	// call fn on every element around that element (sibling), return true to break the loop
	crossLeft: function(fn, bind){
		return this.crossDirection('left', fn, bind);
	},

	crossRight: function(fn, bind){
		return this.crossDirection('right', fn, bind);
	},

	crossAround: function(fn, bind){
		return this.crossDirection('both', fn, bind);
	},
	
	/*
	crossInterval: function(element, fn){
		var from = this, to = element, ancestor, after;

		// if we pass an element before this one in the document order
		if( this.compareDocumentPosition(to) & Node.DOCUMENT_POSITION_PRECEDING ){
			from = element;
			to = this;
		}

		ancestor = Element.prototype.getCommonAncestor.call(from, to);
		after = ancestor == from;
		ancestor.crossAll(function(descendant){
			// im before the from element
			if( !after ) after = descendant == from;
			// im at the to element, break the loop
			else if( descendant == to ) return true;
			// im between from & to
			else return fn(descendant);
		});

	}
	*/
};
