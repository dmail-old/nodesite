Function.COMPARE = function(a, b){ return a < b ? -1 : a > b ? 1 : 0; };

Array.implement('getInsertionOrderIndex', function(item, compare){
	var i = 0, j = this.length;

	if( compare == null ) compare = Function.COMPARE;

	for(;i<j;i++){
		if( compare(item, this[i]) === -1 ){
			return i;
		}
	}

	return j;
});

// permet d'insérer item dans this en respectant l'ordre imposé par compare
Array.implement('insertSort', function(item, compare){
	this.splice(this.getInsertionOrderIndex(item, compare), 0, item);
	return this;
});