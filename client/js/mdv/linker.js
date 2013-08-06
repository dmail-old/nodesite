// a linker is an object returned by a parser
var Linker = {
	path: null,
	toString: function(){
		return 'Linker';
	},
	link: Function.EMPTY,
	unlink: Function.EMPTY
};

var PropertyLinker = Linker.extend({
	nodeAttribute: null,
	modelProperty: null,

	create: function(nodeAttribute, modelProperty){
		this.nodeAttribute = nodeAttribute;
		this.modelProperty = modelProperty;
	},

	toString: function(){
		return 'PropertyLinker';
	},

	link: function(node, model){
		node.bind(this.nodeAttribute, model, this.modelProperty);
	},

	unlink: function(node, model){
		node.unbind(this.nodeAttribute);
	}
});

var TokenLinker = Linker.extend({
	nodeAttribute: null,
	modelProperty: null,
	prefix: '',
	suffix: '',

	create: function(nodeAttribute, modelProperty, prefix, suffix){
		this.nodeAttribute = nodeAttribute;
		this.modelProperty = modelProperty;
		this.prefix = prefix;
		this.suffix = suffix;
	},

	toString: function(){
		return 'TokenLinker';
	},

	link: function(node, model){
		var self = this;
		var observer = window.PathObserver.new(this.modelProperty, model, function(change){
			this.value = self.prefix + change.value + self.suffix;
		});

		node.bind(this.nodeAttribute, observer, 'value');
	},

	unlink: function(node){
		node.unbind(this.nodeAttribute);
	}
});

var TokensLinker = Linker.extend({
	nodeAttribute: null,
	tokens: null,

	create: function(nodeAttribute, tokens){
		this.nodeAttribute = nodeAttribute;
		this.tokens = tokens;
	},

	toString: function(){
		return 'TokensLinker';
	},

	combine: function(values){
		var tokens = this.tokens, result = tokens[0], i = 1, j = tokens.length, value;

		for(;i<j;i+=2){
			value = values[tokens[i]];
			if( value !== undefined ){
				result+= value;
			}
			result+= tokens[i + 1];
		}

		return result;
	},

	link: function(node, model){
		var computedBinding = window.ComputedBinding.new(this.combine, this);

		var tokens = this.tokens, i = 1, j = this.tokens.length;
		for(;i<j;i+=2){
			// observe part, but dont call resolve for each part change
			computedBinding.observe(tokens[i], model, tokens[i], true);
		}
		// resolve computedBinding.value
		computedBinding.resolve();

		node.bind(this.nodeAttribute, computedBinding, 'value');
	},

	unlink: function(node, model){
		node.unbind(this.nodeAttribute);
	}
});

var LinkerListLinker = Linker.extend({
	list: null,

	create: function(list){
		this.list = list;
	},

	toString: function(){
		return 'LinkerListLinker';
	},

	link: function(node, model){
		var list = this.list, i = 0, j = list.length;
		for(;i<j;i++){
			list[i].link(node, model);
		}
	},

	unlink: function(node, model){
		var list = this.list, i = 0, j = list.length;
		for(;i<j;i++){
			list[i].unlink(node, model);
		}
	}
});
