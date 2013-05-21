/* finder

NOTE
- les doublons ne sont pas géré, il faut appeler uniq() sur le tableau retourné (sinon getNodes(0,0) retourne un tableau contenant deux fois le même noeud)
- les noeuds ne sont pas triés, il faut appeler sort(Element.sorter) sur le tableau retourné pour qu'il le soit (pour tree node node.orderBy('rank'))

*/

Element.sorter = (function(){
	if( document.html.compareDocumentPosition ){
		return function(a, b){
			if( !a.compareDocumentPosition || !b.compareDocumentPosition ) return 0;
			return a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
		};
	}
	
	if( 'sourceIndex' in document.html ){
		return function(a, b){
			if( !a.sourceIndex || !b.sourceIndex ) return 0;
			return a.sourceIndex - b.sourceIndex;
		};
	}
	
	if( document.createRange ){
		return function(a, b){
			if (!a.ownerDocument || !b.ownerDocument) return 0;
			var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
			aRange.setStart(a, 0);
			aRange.setEnd(a, 0);
			bRange.setStart(b, 0);
			bRange.setEnd(b, 0);
			return aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
		};
	}
	
	return Function.ZERO;
})();

(function(){

Element.implement({
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
			if( bind ) fn = fn.bind(bind);
			Array.prototype.iterate.call(children, fn, direction, index);
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
	
	matchIterator: function(iterator, match, first){
		return Finder.matchIterator.call(this, iterator, match, first);
	},
	
	matchFirst: function(iterator){
		var i, j = arguments.length, item;
	
		if( j === 1 ){
			item = this.matchIterator(iterator, true, true);
		}
		else{
			for(i=1;i<j;i++){
				item = this.matchIterator(iterator, arguments[i], true);
				if( item ) break;
			}
		}
		
		return item;
	},
	
	matchAll: function(iterator){
		var i, j = arguments.length, found;
	
		if( j === 1 ){
			found = this.matchIterator(iterator, true);
		}
		else{
			found = this.matchIterator(iterator, arguments[1]);
			for(i=2;i<j;i++) found = found.concat(this.matchIterator(iterator, arguments[i]));
		}
		
		return found;
	}
});

Object.forEach({
	element: Element.prototype.crossAll,
	parent: Element.prototype.crossUp,
	child: Element.prototype.cross,
	// lastchild: function(match, first){
		// return Array.prototype.matchIterator.call(this.children, match, first, 'left');
	// },
	next: Element.prototype.crossRight,
	prev: Element.prototype.crossLeft,
	sibling: Element.prototype.crossAround
}, function(iterator, name){
	var maj = name.capitalize();
	Element.prototype['get' + maj] = Element.prototype.matchFirst.curry(iterator);
	Element.prototype['get' + maj + 's'] = Element.prototype.matchAll.curry(iterator);
});

Element.prototype.match = function(){
	var i = 0, j = arguments.length;
	
	for(;i<j;i++){
		if( Finder.from(arguments[i])(this) ) return true;
	}
	
	return false;
};

document.getElement = document.html.getElement.bind(document.html);
document.getElements = document.html.getElements.bind(document.html);
window.$$ = document.getElements.bind(document);

})();