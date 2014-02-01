NS.NodeFinder = {
	match: function(){
		var i = 0, j = arguments.length;

		for(;i<j;i++){
			if( NS.Selector.new(arguments[i]).match(this) ) return true;
		}

		return false;
	}
};

Object.eachPair(NS.NodeTraversal, function(name, iterator){
	if( typeof iterator != 'function' ) return;

	NS.NodeFinder['get' + name.capitalize()] = function(selector, all){
		if( typeof selector == 'undefined' ){
			selector = true;
		}

		selector = NS.Selector.new(selector);

		return selector.iterate(iterator, this, !all);
	};
});
