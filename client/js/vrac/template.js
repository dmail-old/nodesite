NS.DirectiveList = NS.List.extend({
	collect: function(node){
		if( node.nodeType == 1 ){ // Element

			Array.prototype.forEach.call(node.attributes, this.collect, this);
			Array.prototype.forEach.call(node.childNodes, this.collect, this);
		}
		else if( node.nodeType == 2 || node.nodeType == 3 ){ // attributeNode or textNode
			var value = node.nodeValue;

			if( value.contains('{') ){
				this.push({
					value: value,
					node: node,
					type: 'nodeValue'
				});
			}
		}
	}
});

NS.Template = {
	element: null,
	directiveList: null,

	create: function(element){
		this.element = element;
	},

	compile: function(node){
		var directiveList;

		if( this.directiveList ){
			directiveList = this.directiveList;
		}
		else{
			directiveList = NS.DirectiveList.new();
			directiveList.collect(this.element);
			this.directiveList = directiveList;
		}

		return directiveList;
	},

	callDirective: function(directive, data){

		if( directive.type == 'nodeValue' ){
			directive.node.nodeValue = directive.value.replace(RegExp.BRACLET, function(match, path){
				if( match.charAt(0) == '\\' ) return match.slice(1);
				var value = data[path];
				return value != null ? value : '';
			});
		}

	},

	render: function(data){
		var directiveList = this.compile();

		directiveList.forEach(function(directive){
			this.callDirective(directive, data);
		}, this);

		return directiveList;
	}
};
