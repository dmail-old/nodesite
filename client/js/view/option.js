/* global View, TreeStructure, TreeTraversal, TreeFinder  */

View.extend('option', {
	Implements: [TreeStructure, TreeTraversal, TreeFinder],
	tagName: 'li',
	className: 'node'
});
