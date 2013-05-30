/* global Model, TreeStructure */

var NodeModel = new Class(Model, {
	name: '',

	initialize: function(){
		Model.prototype.initialize.apply(this, arguments);

		this.initChildren(this.get('children'));
		if( this.has('name') ) this.name = this.get('name');
	},

	toString: function(){
		return 'NodeModel';
	},

	adopt: function(child, index){
		index = typeof index != 'number' ? this.children.length : index.limit(0, this.children.length);

		this.insertBefore(child, this.children[index]);
		//child.crossAll(function(node){ node.emit('enter'); }, null, true);
		this.emit('adopt', child, index);

		return this;
	},

	emancipate: function(){
		this.parentNode.removeChild(this);
		//this.crossAll(function(node){ node.emit('leave'); }, null, true);
		this.emit('emancipate');

		return this;
	},

	sync: function(action, args, callback){

	}
});

NodeModel.implement(TreeStructure);

