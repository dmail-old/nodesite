NS.Document = {
	constructors: null,
	baseNode: null,
	emitter: null,

	constructor: function(baseNode){
		this.constructors = {};
		this.childNodes = [];
		this.emitter = NS.Emitter.new(this);
		this.baseNode = baseNode;
	},

	define: function(name){
		var constructor = this.baseNode.extend.apply(this.baseNode, Array.slice(arguments, 1));
		this.constructors[name] = constructor;
	},

	require: function(name){
		return typeof name == 'string' ? this.constructors[name] : name;
	},

	createNode: function(name, data){
		var constructor = this.require(name), node;

		if( !constructor ){
			throw new Error('undefined node type ' + name);
		}

		if( constructor.isPrototypeOf(data) ){
			node = data;
		}
		else{
			node = constructor.new(data);
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
