var exports = {
	// call fn on every child of the element, returns true to break the loop
	crossChild: function(fn, bind){
		var children = this.children, i = 0, j = children.length;

		for(;i<j;i++){
			if( fn.call(bind, children[i], i) === true ) break;
		}

		return this;
	},

	// call fn on every descendant of the element
	// returns true to break the loop or 'continue' to ignore the descendant of the current element
	crossNode: function(fn, bind, includeSelf){
		function run(node){
			var ret = fn.call(bind, node);
			if( ret ) return ret != 'continue';
			node.crossChild(run);
		}

		if( includeSelf ) run(this); else this.crossChild(run);

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
	crossParent: function(fn, bind){
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
			Array.prototype.iterate.call(children, fn, bind, direction, index);
		}

		return this;
	},

	// call fn on every element around that element (sibling), return true to break the loop
	crossPrevSibling: function(fn, bind){
		return this.crossDirection('left', fn, bind);
	},

	crossNextSibling: function(fn, bind){
		return this.crossDirection('right', fn, bind);
	},

	crossSibling: function(fn, bind){
		return this.crossDirection('both', fn, bind);
	}
};

NS.treeTraversal = exports;

/*

unused, cross next or prev node

TreeTraversal.crossNextNode = function(fn, bind){
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

TreeTraversal.crossPrevNode = function(fn, bind){
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

NOTE: calling NS.implement(TreeStructure) currently call Object.mergePair on object
it doesn't copy properties defined by Object.defineProperty
Object.create should be used for that or TreeStructure have to be a NS with prototype and not and object
if we want to copy those hidden properties we have to do it manually

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

in the case we want to add it to Element.prototype we have to add the lastNode property

Object.defineProperty(Element.prototype, 'lastNode', childrenInterface.lastNode);

+// pas mal ça aussi pour nextNode
+function nextNode(root, fn, bind){
+ 	var node = root.firstChild;
+	var first, node;
+
+	while( node != null ){
+		ret = fn.call(bind, node);
+		if( ret === true ) break;
+
+		first = node.firstChild;
+		if( first ){
+			node = first;
+		}
+		else{
+			next = node.nextSibling;
+			while(next == null){
+				node = node.parentNode;
+				if( node == root ) break;
+				next = node.nextSibling;
+			}
+			node = next;
+		}
+	}
+
+	return node;
+}
 
+function prevNode(root, fn, bind){
+	var node = node.parentNode;
+
+	while(node != null){
+		ret = fn.call(bind, node);
+		if( ret === true ) break;
+
+		prev = node.previousSibling;
+		if( prev ){
+			node = prev;
+			last = prev.lastNode;
+			if( last ) node = last;
+		}
+		else{
+			node = node.parentNode;
+		}
+	}
+}


*/
