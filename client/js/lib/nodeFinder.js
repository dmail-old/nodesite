NS.NodeFinder = {
	match: function(){
		var i = 0, j = arguments.length;

		for(;i<j;i++){
			if( NS.Filter.toFilter(arguments[i])(this) == NS.Filter.ACCEPT ) return true;
		}

		return false;
	}
};

Object.eachPair(NS.NodeTraversal, function(name, iterator){
	NS.NodeFinder['get' + name.capitalize()] = function(filter, bind, all){
		if( typeof filter == 'undefined' ){
			filter = true;
		}
		return NS.Filter.filterIterator(iterator, this, !all, filter, bind);
	};
});
