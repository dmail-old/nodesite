NS.Document = {
	constructors: null,
	baseNode: null,

	constructor: function(baseNode){
		this.constructors = {};
		this.children = [];
		this.emitter = NS.Emitter.new(this);
		this.baseNode = baseNode;
	},

	define: function(name){
		var constructor = this.baseNode.extend.apply(this.baseNode, toArray(arguments, 1));
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
		this.createChildren(node);

		return node;
	},

	createChildren: function(node){
		var children = node.children;

		node.children = [];

		if( children ){
			children.forEach(function(child){
				node.appendChild(this.createNode(node.getPrototype(), child));
			}, this);
		}
	}
}.supplement(NS.NodeInterface, NS.EmitterInterface);
