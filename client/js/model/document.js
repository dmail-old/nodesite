NS.DocumentModel = NS.TreeModel.extend({
	constructor: function(){
		this.ownerDocument = this;
		NS.TreeModel.constructor.apply(this, arguments);
	},

	getChildItem: function(){
		return NS.NodeTreeModel;
	},

	createNode: function(data){
		var constructor = this.getChildItem(), node;

		if( constructor.isPrototypeOf(data) ){
			node = data;
		}
		else{
			node = constructor.new(data);
		}

		node.ownerDocument = this;

		if( node.has('children') ){
			node.get('children').forEach(function(child){
				node.appendChild(this.createNode(child));
			}, this);
		}

		return node;
	}
});
