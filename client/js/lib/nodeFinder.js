NS.NodeFinder = {
	match: function(){
		var i = 0, j = arguments.length;

		for(;i<j;i++){
			if( NS.Filter.toFilter(arguments[i])(this) == NS.Filter.ACCEPT ) return true;
		}

		return false;
	},

	filterIterator: function(iterator, first, filter, bind){
		if( typeof filter == 'undefined' ){
			filter = true;
		}

		return NS.Filter.filterIterator(iterator, this, first, filter, bind);
	}
};

Object.eachPair(NS.NodeTraversal, function(name, method){
	var maj = name.capitalize();

	NS.NodeFinder['get' + maj] = function(filter, bind){
		return this.filterIterator(method, true, filter, bind);
	};

	NS.NodeFinder['get' + maj + 's'] = function(filter, bind){
		return this.filterIterator(method, false, filter, bind);
	};
});
