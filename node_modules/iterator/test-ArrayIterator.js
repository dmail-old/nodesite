// see http://people.mozilla.org/~jorendorff/es6-draft.html#sec-%iteratorprototype%-object
exports['Array.prototype[\'@@iterator\']() prototype is ArrayIterator'] = function(test, ArrayIterator){
	var arrayIterator = [][Symbol.iterator]();

	test.equal(arrayIterator.toString(), '[object Array Iterator]');
};