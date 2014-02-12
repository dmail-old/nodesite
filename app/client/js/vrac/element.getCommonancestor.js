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
