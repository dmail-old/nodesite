
var TextNodeDirective = {
	path: null,
	node: null,

	create: function(path, node){
		this.path = path;
		this.node = node;
	},

	findClone: function(cloneNode){
		var parts = this.path.split('.'), i = 0, j = parts.length;

		for(;i<j;i++){
			cloneNode = cloneNode.childNodes[parts[i]];
			if( cloneNode == null ){
				throw new Error('node not found');
			}
		}

		return cloneNode;
	},

	getValue: function(){
		return this.node.nodeValue;
	},

	getProperty: function(){
		var value = this.getValue();
		return value.substring(1, value.length - 1);
	},

	update: function(value, oldvalue){
		this.nodeValue = value;
	},

	link: function(node, view){
		view.watch(this.getProperty(), this.update, node);
	},

	linkClone: function(cloneNode, view){
		this.link(this.findClone(cloneNode), view);
	}
};

var AttributeDirective = TextNodeDirective.extend({
	create: function(){
		TextNodeDirective.create.apply(this, arguments);

		// avoid browser to request a wrong src
		if( this.node.name == 'src' ){
			var value = this.node.value;
			this.getValue = function(){
				return value;
			};
			this.update = function(value){
				this.value = value || Image.EMPTY;
			};

			this.update.call(this.node, Image.EMPTY);
		}
	},

	getValue: function(){
		return this.node.value;
	},

	update: function(value, oldvalue){
		this.value = value;
	},

	findClone: function(cloneNode){
		cloneNode = TextNodeDirective.findClone.call(this, cloneNode);
		cloneNode = cloneNode.attributes.getNamedItem(this.node.name);
		return cloneNode;
	}
});

// show a blank image, useful to have a default src attribute
Image.EMPTY = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

NS.Template = {
	cache: {},
	element: null,

	create: function(element, id){
		if( id ) this.cache[id] = this;
		if( typeof element == 'string' ) element = element.toElement();
		this.element = element;
	},

	iterate: function(path, node, directives){
		var childNodes, i, j, attr, child;

		if( path !== '' ) path+= '.';

		childNodes = node.childNodes;
		i = 0;
		j = childNodes.length;
		for(;i<j;i++){
			child = childNodes[i];
			this.collectDirectives(path + i, child, directives);
		}
	},

	collectDirectives: function(path, node, directives){
		var attributes, i, j, attr, value, directive;

		if( node.nodeType == 1 ){ // element
			attributes = node.attributes;
			i = 0;
			j = attributes.length;
			for(;i<j;i++){
				attr = attributes[i];
				value = attr.value;

				if( value.startsWith('{') && value.endsWith('}') ){
					directive = AttributeDirective.new(path, attr);
					directives.push(directive);
				}
			}

			this.iterate(path, node, directives);
		}
		else if( node.nodeType == 3 ){ // textnode
			value = node.nodeValue;

			if( value.startsWith('{') && value.endsWith('}') ){
				directive = TextNodeDirective.new(path, node);
				directives.push(directive);
			}
		}

		return directives;
	},

	compile: function(){
		if( this.directives ){
			return this.directives;
		}
		else{
			this.directives = [];
			this.collectDirectives('', this.element, this.directives);
			return this.directives;
		}
	},

	clone: function(){
		return this.element.cloneNode(true);
	},

	link: function(view){
		var clone = this.clone(), directives = this.compile(), i = directives.length;

		while(i--){
			directives[i].linkClone(clone, view);
		}

		return clone;
	}
};
