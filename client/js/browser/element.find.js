/* global */

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
			return aRange.compareBoundaryPoints(window.Range.START_TO_END, bRange);
		};
	}

	return Function.ZERO;
})();

Element.prototype.getCommonAncestor = function(element){
	var parentA = this, parents = [], parentB = element;

	while(parentA){
		parentA = parentA.parentNode;
		if( !parentA ) return this;
		parents.push(parentA);
	}
	while(parentB){
		parentB = parentB.parentNode;
		if( !parentB ) return element;
		if( parents.contains(parentB) ) return parentB;
	}

	return null;
};

Element.implement(NS('treetraversal'), NS('treefinder'));

document.getNode = document.html.getNode.bind(document.html);
document.getNodes = window.$$ = document.html.getNodes.bind(document.html);
