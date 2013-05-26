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
	}
};

/*

unused, cross next or prev node

TreeTraversal.crossNext = function(fn, bind){
	var node = this, next, first, ret;
	
	while( true ){
		first = node.firstChild;
		if( first ){
			node = first;
			ret = fn.call(bind, node);
			if( ret === true ) break;
		}
		
		while( node.parentNode ){
			next = node.nextSibling;
			if( next ){
				node = next;
				ret = fn.call(bind, node);
				if( ret === true ) return this;
				else break;
			}
			node = node.parentNode;
		}
	}
	
	return this;
};

TreeTraversal.crossPrev = function(fn, bind){
	var node = this, parent, prev, last, ret;
	
	while( true ){
		parent = node.parentNode;
		if( !parent ) break;
		
		prev = node.previousSibling;
		if( prev ){
			node = prev;
			last = prev.lastNode;
			if( last ) node = last;
			ret = fn.call(bind, node);
			if( ret == true ) break;
		}
		
		node = parent;
		ret = fn.call(bind, node);
		if( ret === true ) break;
	}

	return this;	
};

in the case we want to add it to Element.prototype we have to add the lastNode property

Object.defineProperty(Element.prototype, 'lastNode', {
	'get': function(){
		var node = this, last = null;

		while( node = node.lastChild ){
			last = node;
		}

		return last;
	}
});

in case we want to add it to any Item implementing TreeStructure we have to add 'firstChild', 'lastChild', 'previousSibling', 'nextSibling'
to be able to use those methods

NOTE: calling Class.implement(TreeStructure) currently call Object.mergePair on object
it doesn't copy properties defined by Object.defineProperty
Object.create should be used for that or TreeStructure have to be a Class with prototype and not and object
if we want to copy those hidden properties we have to do it manually

Object.defineProperties(TreeStructure, {
	'firstChild': {
		'get': function(){
			return this.children.length === 0 ? null : this.children[0];
		}
	},
	
	'lastChild': {
		'get': function(){
			return this.children.length === 0 ? null : this.children[this.children.length - 1];
		}
	},
	
	'nextSibling': {
		'get': function(){
			var node = this, parent = node.parentNode, next = null;
			
			if( parent ){
				next = parent.children[parent.children.indexOf(node) + 1] || null;
			}
			
			return next;
		}
	},
	
	'previousSibling': {		
		'get': function(){		
			var node = this, parent = node.parentNode, prev = null;
			
			if( parent ){
				prev = parent.children[parent.children.indexOf(node) - 1] || null;
			}
			
			return prev;
		}
	}
});

*/