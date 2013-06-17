var exports = NS.treeFinder = {
	matchIterator: function(iterator, match, first){
		return NS.Finder.matchIterator(iterator, this, match, first);
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
	},

	match: function(){
		var i = 0, j = arguments.length;

		for(;i<j;i++){
			if( NS.Finder.from(arguments[i])(this) ) return true;
		}

		return false;
	},

	createFindMethod: function(iterator){
		return this.matchFirst.curry(iterator);
	},

	createFindAllMethod: function(iterator){
		return this.matchAll.curry(iterator);
	}
};

exports.traversalMethods = {
	node: 'crossNode',
	parent: 'crossParent',
	child: 'crossChild',
	last: 'crossReverse',
	nextSibling: 'crossNextSibling',
	prevSibling: 'crossPrevSibling',
	sibling: 'crossSibling'
};

Object.eachPair(exports.traversalMethods, function(axis, iteratorName){
	var maj = axis.capitalize();

	exports['get' + maj] = exports.createFindMethod(NS.treeTraversal[iteratorName]);
	exports['get' + maj + 's'] = exports.createFindAllMethod(NS.treeTraversal[iteratorName]);
});

/*

unused

exports.getPrevNode = exports.createFindMethod(exports.treeTraversal.crossPrevNode);
exports.getNextNode = exports.createFindMethod(exports.treeTraversal.crossNextNode);

*/
