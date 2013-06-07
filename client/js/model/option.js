/* global Model, TreeStructure, TreeTraversal, TreeFinder */

Model.extend('option', {
	Implements: [TreeStructure, TreeTraversal, TreeFinder],
	name: '',

	constructor: function NodeModel(){
		Model.prototype.constructor.apply(this, arguments);

		this.initChildren(this.get('children'));
		if( this.has('name') ) this.name = this.get('name');
	},

	oninsertchild: function(child){
		this.emit('adopt', child, this.children.indexOf(child));
	},

	onremovechild: function(child){
		child.emit('emancipate');
	}
});
