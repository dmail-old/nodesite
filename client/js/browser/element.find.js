Element.implement(NS.NodeFinder);

document.getFirst = document.html.getFirst.bind(document.html);
document.getFirst = window.$$ = document.html.getFirst.bind(document.html);

if( !Element.prototype.compareDocumentPosition ){
	Element.prototype.compareDocumentPosition = NS.NodeInterface.compareDocumentPosition;
}

// this function is meant to be used as comparer for array.sort
Element.comparePosition = function(a, b){
	if( !a.compareDocumentPosition || !b.compareDocumentPosition ) return 0;
	if( a === b ) return 0;
	if( a.compareDocumentPosition(b) & NS.NodeInterface.FOLLOWING ) return -1;
	return 1;
};
