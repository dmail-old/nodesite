var Directive = {
	path: null,
	node: null,

	create: function(path, node){
		this.path = path;
		this.node = node;
	},

	link: Function.IMPLEMENT,

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

	linkClone: function(cloneNode, view){
		this.link(this.findClone(cloneNode), view);
	}
};

var TextNodeDirective = Directive.extend({
	getProperty: function(){
		var value = this.node.nodeValue;
		return value.substring(1, value.length - 1);
	},

	update: function(value, oldvalue){
		this.nodeValue = value;
	},

	link: function(node, view){
		view.watch(this.getProperty(), this.update, node);
	}
});

var AttributeDirective = Directive.extend({
	attr: null,
	create: function(path, attr){
		Directive.create.apply(this, arguments);
		this.attr = attr;

		// avoid browser to request a wrong src
		if( attr.name == 'src' ){
			var value = attr.value;
			this.getValue = function(){
				return value;
			};
			this.update = function(value){
				this.value = value || Image.EMPTY;
			};

			this.update.call(this.attr, Image.EMPTY);
		}
	},

	findClone: function(cloneNode){
		cloneNode = Directive.findClone.call(this, cloneNode);
		cloneNode = cloneNode.attributes.getNamedItem(this.attr.name);
		return cloneNode;
	},

	getProperty: function(){
		var value = this.attr.value;
		return value.substring(1, value.length - 1);
	},

	update: function(value, oldvalue){
		this.value = value;
	},

	link: TextNodeDirective.link
});

var EventDirective = Directive.extend({
	getName: function(){
		return this.node.name.slice('data-'.length);
	},

	getValue: function(){
		return this.node.value;
	},

	link: function(node, view){
		node.addEventListener(this.getName(), view[this.getValue()].bind(view));
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

				if( attr.name == 'data-click' ){
					directive = EventDirective.new(path, attr);
					directives.push(directive);
					continue;
				}

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
