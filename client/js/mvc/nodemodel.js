var NodeModel = new Class({
	Extends: Model,
	
	initialize: function(){
		Model.prototype.initialize.apply(this, arguments);
		
		this.name = this.get('name') || '';
		this.children = this.has('children') ? this.parseChildren(this.get('children')) : [];
	},
	
	toString: function(){
		return 'NodeModel';
	},
	
	parseChildren: function(children){		
		children.forEach(this.appendChild, this);
		return children;
	},
	
	appendChild: function(child, index, children){
		child = this.create(child);
		children[index] = child;
		child.parentNode = this;
		
		return child;
	},
	
	setChildren: function(children){
		children = this.parseChildren(children);
		
		// supprime les enfants actuels avant de mettre les nouveaux
		var i = this.children.length;
		while(i--) this.children[0].emancipate();
		// appelle adopt sur chaque child
		children.forEach(this.adopt, this);
		
		return this;
	},
	
	adopt: function(child, index){
		child = this.create(child);
		index = typeof index != 'number' ? this.children.length : index.limit(0, this.children.length);
		
		child.parentNode = this;
		this.children.splice(index, 0, child);
		//child.crossAll(function(node){ node.emit('enter'); }, null, true);
		this.emit('adopt', child, index);
		
		return this;
	},
	
	emancipate: function(){
		if( this.parentNode ){
			this.parentNode.children.remove(this);
			delete this.parentNode;	
		}
		//this.crossAll(function(node){ node.emit('leave'); }, null, true);
		this.emit('emancipate');
		
		return this;
	},
	
	sync: function(action, args, callback){
		
	}
});

