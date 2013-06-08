/* global */

Class.extend('view', 'rootnode', Class('view').Node, {
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
		Class('view').prototype.constructor.call(this);
	},

	getChildConstructor: function(){
		return Class('view.node');
	},

	getChildrenElement: function(){
		return this.element;
	},
});
