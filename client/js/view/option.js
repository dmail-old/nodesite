/* global View, TreeStructure, TreeTraversal, TreeFinder  */

View.define('option', {
	Implements: [TreeStructure, TreeTraversal, TreeFinder],
	tagName: 'li',
	className: 'node'
});
