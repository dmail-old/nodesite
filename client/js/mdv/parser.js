window.Parser = {
	parsers: [],

	collect: function(node, path){
		var found = [], parsers = this.parsers, i = 0, j = parsers.length;
		var nodeType = node.nodeType, linker, terminal = false;

		if( typeof path != 'string' ) path = '';

		for(;i<j;i++){
			linker = parsers[i].call(this, node);
			if( window.Linker.isPrototypeOf(linker) ){
				linker.path = path;
				found.push(linker);
				if( linker.terminal ) terminal = true;
			}
		}

		// keep searching linkers
		if( terminal === false && (nodeType == 1 || nodeType == 11) ){
			found = found.concat(this.collectChildNodes(node, path));
		}

		return found;
	},

	collectNodeList: function(nodeList, path){
		var found = [], i = 0, j = nodeList.length;

		if( typeof path != 'string' ){
			path = '';
		}
		else if( path !== '' ){
			path+= '.';
		}

		for(;i<j;i++){
			found = found.concat(this.collect(nodeList[i], path + i));
		}

		return found;
	},

	collectChildNodes: function(node, path){
		return this.collectNodeList(node.childNodes, path);
	},

	parse: function(element, descendantOnly){
		var found;

		if( descendantOnly ){
			found = this.collectChildNodes(element);
		}
		else{
			found = this.collect(element);
		}

		return found;
	},

	register: function(directive){
		this.parsers.push(directive);
	},

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

	getTokensLinker: function(name, tokens){
		// {name} -> tokens contains only one mustache, no prefix/suffix
		if( tokens.length == 3 && tokens[0].length === 0 && tokens[2].length === 0 ){
			return window.PropertyLinker.new(name, tokens[1]);
		}
		// Hello: {name}! -> tokens contains one mustache and/or a prefix/suffix
		else if( tokens.length === 3 ){
			return window.TokenLinker.new(name, tokens[1], tokens[0], tokens[2]);
		}
		// Hello {name}, you are {age} years old! -> list of tokens
		else{
			return window.TokenListLinker.new(name, tokens);
		}
	},

	getLinker: function(name, value){
		var tokens = this.parseMustacheTokens(value);

		if( tokens ){
			return this.getTokensLinker(name, tokens);
		}

		return false;
	}
};

window.Parser.register(function parseTextContent(node){
	if( node.nodeType != 3 ) return false;

	return this.getLinker('textContent', node.textContent);
});

window.Parser.register(function parseAttributes(node){
	if( node.nodeType != 1 ) return false;

	var attributes = node.attributes, i = 0, j = attributes.length, attr, linker;
	var linkerlist = [];

	for(;i<j;i++){
		attr = attributes[i];
		linker = this.getLinker(attr.name, attr.value);
		if( linker ){
			linkerlist.push(linker);
		}
	}

	if( linkerlist.length === 0 ) return false;
	if( linkerlist.length === 1 ) return linkerlist[0];
	return window.LinkerListLinker.new(linkerlist);
});

window.Parser.register(function parseSubTemplate(node){
	if( window.HTMLTemplateElement.isTemplate(node) ){
		return window.SubTemplateLinker.new(node);
	}
});

