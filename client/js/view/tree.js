/* global */

NS.TreeEmitter = require('../lib/emitter.js').extend({
	applyListeners: function(name, args){
		if( this.bind.parentNode ){
			this.bind.parentNode.treeEmitter.applyListeners(name, args);
		}
		return require('../lib/emitter.js').applyListeners.call(this, name, args);
	}
});

var TreeView = {
	//className: 'node',
	modelEvents: {
		'adopt': function(child, index){
			this.insertBefore(child, this.children[index]);
		},

		'emancipate': function(){
			this.parentNode.removeChild(this);
		},
	},

	constructor: function(){
		// this.treeEmitter = NS.new('emitter.tree', this);
		// this.on('*', function(name, args){
		// 	args = [this].concat(args);
		// 	this.treeEmitter.applyListeners(name, args);
		// });

		this.initChildren();
		require('../view.js').constructor.apply(this, arguments);
	},

	setModel: function(model){
		require('../view.js').setModel.call(this, model);
		if( model && model.children ){
			this.setChildren(model.children);
		}
	},

	oninsertchild: function(child){
		var childrenElement = this.getChildrenElement();
		// si cette vue possède l'élément qui contient les enfants on insère l'enfant
		if( childrenElement ){
			child.insertElement(childrenElement, child.getNextSibling(), true);
		}
	},

	onremovechild: function(child){
		child.removeElement();
	},

	getChildrenElement: Function.IMPLEMENT,

	setChildrenElement: function(element){
		this.childrenElement = element;
	},

	createChildrenElement: function(element){
		return new Element('ul');
	},

	insertChildren: function(element){
		this.setChildrenElement(element);
		this.children.forEach(function(child){ child.insertElement(element); });
	},

	renderChildren: function(){
		var childrenElement = this.createChildrenElement();
		this.element.appendChild(childrenElement);
		this.insertChildren(childrenElement);
	}
};

module.exports = require('../view.js').extend(
	require('../lib/treeStructure.js'),
	require('../lib/treeTraversal.js'),
	require('../lib/treeFinder.js'),
	TreeView
);
