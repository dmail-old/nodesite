NS.TreeView = NS.View.extend(NS.viewstate, {
	modelEvents: {
		'adopt': function(child, index){
			this.insertBefore(child, this.children[index]);
		},

		'emancipate': function(){
			this.parentNode.removeChild(this);
		},
	},

	setModel: function(model){
		NS.View.setModel.call(this, model);
		if( model && model.children ){
			this.setChildren(model.children);
		}
	},

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
});
