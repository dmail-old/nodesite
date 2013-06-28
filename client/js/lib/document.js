NS.Document = {
	Nodes: null,
	emitter: null,

	create: function(){
		this.Nodes = {};
		this.childNodes = [];
		this.emitter = NS.Emitter.new(this);
	},

	define: function(name, Node){
		this.Nodes[name] = Node;
		return Node;
	},

	require: function(name){
		return typeof name == 'string' ? this.Nodes[name] : name;
	},

	createNode: function(name, data){
		var Node = this.require(name), node;

		if( !Node ){
			throw new Error('undefined node type ' + name);
		}

		if( Node.isPrototypeOf(data) ){
			node = data;
		}
		else{
			node = Node.new(data);
		}

		node.ownerDocument = this;
		this.createChildNodes(node);

		return node;
	},

	createChildNodes: function(node){
		var childNodes = node.childNodes;

		node.childNodes = [];

		if( childNodes ){
			childNodes.forEach(function(child){
				node.appendChild(this.createNode(node.getPrototype(), child));
			}, this);
		}
	}
}.supplement(NS.NodeInterface, NS.EmitterInterface);
