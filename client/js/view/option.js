/* global View, TreeStructure, TreeTraversal, TreeFinder  */

View.extends('option', {
	Implements: [TreeStructure, TreeTraversal, TreeFinder],
	tagName: 'li',
	className: 'node'
});
