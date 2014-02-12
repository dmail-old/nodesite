
// call a function over each element between two others
Element.implement('crossInterval', function(target, fn, bind){
	var parentA = this, parentB = target, aparents = [], bparents = [], ancestor, after, i, found = false;

	// list parent the first Element
	while(parentA = parentA.parentNode) aparents.push(parentA);
	// find the common ancestor for the tow elements
	while(parentB = parentB.parentNode){
		if( aparents.contains(parentB) ){
			ancestor = parentB;
			break;
		}
		bparents.push(parentB);
	}

	function run(element){
		found = element == target;
		if( found ) return true;
		return fn.call(bind, element);
	}

	// try to find every element after the first element
	after = this;
	while(after && after != ancestor && !found){
		after.getNext(run);
		after = after.parentNode;
		if( after == ancestor ) break;
	}

	// start from the older parent to reach the second element
	i = bparents.length;
	while(i-- && !found){
		bparents[i].getChild(run);
	}
});
