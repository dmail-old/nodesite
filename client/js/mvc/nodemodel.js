var NodeModel = new Class({
	Extends: Model,
	Implements: TreeStructure,
	name: '',
	
	initialize: function(){
		Model.prototype.initialize.apply(this, arguments);
		
		if( this.has('name') ) this.name = this.get('name');
		if( this.has('children') ) this.children = this.parseChildren(this.get('children'));
		else this.children = [];
	},
	
	toString: function(){
		return 'NodeModel';
	},
	
	setChildren: function(children){		
		children = this.parseChildren(children);
		children.forEach(this.appendChild, this);
		return this;
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

