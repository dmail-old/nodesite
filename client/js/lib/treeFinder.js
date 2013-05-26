/* global Finder, TreeIterator */

var TreeFinder = window.TreeFinder = {
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
};

Object.forEach({
	node: 'crossAll',
	parent: 'crossUp',
	child: 'cross',
	last: 'crossReverse',
	next: 'crossRight',
	prev: 'crossLeft',
	sibling: 'crossAround'
}, function(iteratorName, axis){
	var maj = axis.capitalize();

	TreeFinder['get' + maj] = TreeFinder.createFindMethod(TreeTraversal[iteratorName]);
	TreeFinder['get' + maj + 's'] = TreeFinder.createFindAllMethod(TreeTraversal[iteratorName]);
});

/*

unused

TreeFinder.getPrevNode = TreeFinder.createFindMethod(TreeTraversal.crossPrev);
TreeFinder.getNextNode = TreeFinder.createFindMethod(TreeTraversal.crossNext);

*/