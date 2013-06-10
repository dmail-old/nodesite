/* global Finder, TreeTraversal */

Item('treefinder', {
	matchIterator: function(iterator, match, first){
		return Finder.matchIterator.call(this, iterator, match, first);
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
			if( Finder.from(arguments[i])(this) ) return true;
		}

		return false;
	},

	createFindMethod: function(iterator){
		return this.matchFirst.curry(iterator);
	},

	createFindAllMethod: function(iterator){
		return this.matchAll.curry(iterator);
	}
});

Object.eachPair({
	node: 'crossNode',
	parent: 'crossParent',
	child: 'crossChild',
	last: 'crossReverse',
	nextSibling: 'crossNextSibling',
	prevSibling: 'crossPrevSibling',
	sibling: 'crossSibling'
}, function(axis, iteratorName){
	var TreeFinder = Item('treefinder');
	var TreeTraversal = Item('treetraversal');
	var maj = axis.capitalize();

	TreeFinder['get' + maj] = TreeFinder.createFindMethod(TreeTraversal[iteratorName]);
	TreeFinder['get' + maj + 's'] = TreeFinder.createFindAllMethod(TreeTraversal[iteratorName]);
});

/*

unused

TreeFinder.getPrevNode = TreeFinder.createFindMethod(TreeTraversal.crossPrevNode);
TreeFinder.getNextNode = TreeFinder.createFindMethod(TreeTraversal.crossNextNode);

*/
