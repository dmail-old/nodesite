NS.Document = {
	Nodes: null,
	emitter: null,

	create: function(){
		this.Nodes = {};
		this.childNodes = [];
		//this.emitter = NS.Emitter.new(this);
	},

	define: function(name, Node, trace){
		this.Nodes[name] = Node;

		Node.nodeName = name;

		// j'aimerais tracer la création de certains noeud
		// et disposer d'un liste des noeud de ce type comme document.images ou document.anchors
		/*if( trace ){
			this[name + 's'] = [];
		}*/

		return Node;
	},

	require: function(name){
		return typeof name == 'string' ? this.Nodes[name] : name;
	},

	oncreate: Function.EMPTY,
	oninsert: Function.EMPTY,
	onremove: Function.EMPTY,

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
		this.oncreate(node);

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
}.supplement(NS.NodeInterface/*, NS.EmitterInterface*/);
