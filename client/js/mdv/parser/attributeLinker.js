
/*

name: DirectLinker
description: link a node attribute to a model value
example: <span>{name}</span>

*/
var DirectLinker = window.Linker.extend({
	name: 'DirectLinker',
	nodeAttribute: null, // string, the HTMLElement attribute name ('textContent', 'class')
	modelPath: null, // string, path to the model value ('name', 'user.name')
	
	create: function(nodeAttribute, modelPath){
		this.nodeAttribute = nodeAttribute;
		this.modelPath = modelPath;
	},

	link: function(node, model){
		node.bind(this.nodeAttribute, model, this.modelPath);
	},

	unlink: function(node, model){
		node.unbind(this.nodeAttribute);
	},

	namedScope: function(path, search){
		this.modelPath = this.getNamedScopePath(this.modelPath, path, search);
	}
});

/*

name: TokenLinker
description: link a node attribute to a model value adding a prefix and a suffix
example: <span>Hello {name}!</span>

*/
var TokenLinker = DirectLinker.extend({
	name: 'TokenLinker',
	prefix: '',
	suffix: '',

	create: function(nodeAttribute, modelPath, prefix, suffix){
		this.nodeAttribute = nodeAttribute;
		this.modelPath = modelPath;
		this.prefix = prefix;
		this.suffix = suffix;
	},

	link: function(node, model){
		var self = this;
		var observer = window.PathObserver.new(this.modelPath, model, function(change){
			this.value = self.prefix + change.value + self.suffix;
		});

		// node is binded to observer.value wich is updated when pathobserver changes
		node.bind(this.nodeAttribute, observer, 'value');
	},

	unlink: function(node){
		node.unbind(this.nodeAttribute);
	}
});

/*

name: TokenListLinker
description: link a node attribute to a model multiple values (with prefix and suffix)
example: <span>Hello {name}, you are {age} years old!</span>

*/
var TokenListLinker = window.Linker.extend({
	name: 'TokenListLinker',
	nodeAttribute: null,
	tokens: null,

	create: function(nodeAttribute, tokens){
		this.nodeAttribute = nodeAttribute;
		this.tokens = tokens;
	},

	combine: function(values){
		var tokens = this.tokens, result = tokens[0], i = 1, j = tokens.length, value;

		for(;i<j;i+=2){
			value = values[i];
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

		computedBinding.delayed = true;
		for(;i<j;i+=2){
			// observe part, but dont call resolve for each part change
			computedBinding.observe(i, model, tokens[i]);
		}
		// resolve computedBinding.value
		computedBinding.resolve();

		node.bind(this.nodeAttribute, computedBinding, 'value');
	},

	unlink: function(node, model){
		node.unbind(this.nodeAttribute);
	},

	namedScope: function(path, replace){
		var i = 1, j = this.tokens.length;
		for(;i<j;i+=2){
			this.tokens[i] = TokenLinker.getNamedScopePath(this.tokens[i], path, replace);
		}
	}
});

var AttributeLinker = {
	// https://github.com/Polymer/mdv/blob/master/src/template_element.js#L871
	parseMustacheTokens: function(string){
		if( !string || !string.length ) return;

		var open = '{', close = '}', tokens, length = string.length;
		var startIndex = 0, lastIndex = 0, endIndex = 0;

		while( lastIndex < length ){
			startIndex = string.indexOf(open, lastIndex);
			endIndex = startIndex < 0 ? -1 : string.indexOf(close, startIndex + close.length);
			if( endIndex < 0 ){
				if ( !tokens ) return;
				tokens.push(string.slice(lastIndex)); // TEXT
				break;
			}

			tokens = tokens || [];
			tokens.push(string.slice(lastIndex, startIndex)); // TEXT
			tokens.push(string.slice(startIndex + open.length, endIndex).trim()); // PATH
			lastIndex = endIndex + close.length;
		}

		if( lastIndex === length ){
			tokens.push(''); // TEXT
		}

		return tokens;
	},

	new: function(attributeName, attributeValue){
		var tokens = this.parseMustacheTokens(attributeValue);

		if( !tokens ) return false;

		// {name} -> tokens contains only one mustache, no prefix/suffix
		if( tokens.length == 3 && tokens[0].length === 0 && tokens[2].length === 0 ){
			return window.DirectLinker.new(attributeName, tokens[1]);
		}
		// Hello: {name}! -> tokens contains one mustache and/or a prefix/suffix
		else if( tokens.length === 3 ){
			return window.TokenLinker.new(attributeName, tokens[1], tokens[0], tokens[2]);
		}
		// Hello {name}, you are {age} years old! -> list of tokens
		else{
			return window.TokenListLinker.new(attributeName, tokens);
		}
	}
};

window.Parser.register(function parseTextContent(node){
	if( node.nodeType != 3 ) return false;

	return AttributeLinker.new('textContent', node.textContent);
});