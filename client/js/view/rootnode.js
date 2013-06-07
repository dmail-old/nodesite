/* global View */

View.extend('rootnode', {
	Implements: View.Node,
	tagName: 'ul',
	className: 'root',
	attributes: {
		'tabindex': 0,
	},

	constructor: function NodeView(){
		// this.treeEmitter = new TreeEmitter(this);
		// this.on('*', function(name, args){
		//	args = [this].concat(args);
		//	this.treeEmitter.applyListeners(name, args);
		// });

		this.initChildren();
		View.prototype.constructor.call(this);
	},

	getChildConstructor: function(){
		return View.subclasses.node;
	},

	getChildrenElement: function(){
		return this.element;
	},
});
