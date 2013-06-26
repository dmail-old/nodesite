/*

NOTE
- les doublons ne sont pas géré, il faut appeler uniq() sur le tableau retourné (sinon getNodes(0,0) retourne un tableau contenant deux fois le même noeud)
- les noeuds ne sont pas triés, il faut appeler sort(Element.sorter) sur le tableau retourné pour qu'il le soit (pour tree node node.orderBy('rank'))

*/

if( !Element.prototype.compareDocumentPosition ){
	Element.prototype.compareDocumentPosition = NS.NodeInterface.compareDocumentPosition;
}

Element.sorter = function(a, b){
	if( !a.compareDocumentPosition || !b.compareDocumentPosition ) return 0;
	if( a === b ) return 0;
	if( a.compareDocumentPosition(b) & NS.NodeInterface.FOLLOWING ) return -1;
	return 1;
};

Element.implement('getCommonAncestor', function(element){
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
});

Element.implement(NS.NodeFinder);

document.getNextNode = document.html.getNextNode.bind(document.html);
document.getNextNodes = window.$$ = document.html.getNextNodes.bind(document.html);
