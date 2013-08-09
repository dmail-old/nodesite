var Parser = {
	parsers: [],

	collect: function(node, path){
		if( typeof path != 'string' ) path = '';

		var found = [], parsers = this.parsers, i = 0, j = parsers.length;
		var nodeType = node.nodeType, linker, terminal = false;

		for(;i<j;i++){
			linker = parsers[i].call(this, node);
			if( window.Linker.isPrototypeOf(linker) ){
				linker.path = path;
				found.push(linker);
				if( linker.terminal ) terminal = true;
			}
		}

		// keep searching directives
		if( terminal === false && (nodeType == 1 || nodeType == 11) ){
			found = found.concat(this.collectChildNodes(node, path));
		}

		return found;
	},

	collectNodeList: function(nodeList, path){
		if( typeof path != 'string' ) path = '';
		else if( path !== '' ) path+= '.';

		var found = [], i = 0, j = nodeList.length;

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
	parseMustacheTokens: function(string) {
		if( !string || !string.length ) return;

		var open = '{', close = '}', tokens, length = string.length, startIndex = 0, lastIndex = 0, endIndex = 0;

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

	isSingleBinding: function(tokens){
		return tokens.length == 3 && tokens[0].length === 0 && tokens[2].length === 0;
	},

	isSingleTokenBinding: function(tokens){
		return tokens.length == 3;
	},

	getTokensLinker: function(name, tokens){
		if( this.isSingleBinding(tokens) ){
			return window.PropertyLinker.new(name, tokens[1]);
		}
		else if( this.isSingleTokenBinding(tokens) ){
			return window.TokenLinker.new(name, tokens[1], tokens[0], tokens[2]);
		}
		else{
			return window.TokensLinker.new(name, tokens);
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

Parser.register(function parseTextContent(node){
	if( node.nodeType != 3 ) return false;

	return this.getLinker('textContent', node.textContent);
});

Parser.register(function parseAttributes(node){
	if( node.nodeType != 1 ) return false;

	var attributes = node.attributes, i = 0, j = attributes.length, attr, linker, linkerlist = [];

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

var SubTemplateLinker = window.Linker.extend({
	terminal: true,
	template: null,
	toString: function(){ return 'SubTemplateLinker'; },

	create: function(templateElement){
		this.template = window.Template.new(templateElement);
	},

	link: function(node, model){
		/*

		// trouver pourquoi lorsqu'on répète ce template deux fois node
		// devient vide
		// parce que cloneContent clone content mais lorsqu'il trouve un template
		// en fait il clone le template mais le content a disparu dans un documentfragment

		// dans ce cas pourquoi la première itération fonctionne?
		// -> parce que le content n'a pas encore été mit dans un fragment

		// solution?? mettre le template dans un fragment lorsqu'on crée un template
		// autrement dit bootstrapper le template à la création

		// ou alors modifier cloneContent pourqu'il récup template.content sur
		// les templates non natif


		lorsque node n'est pas un template natif
		le content n'est pas cloné puisque plus dans le DOM mais dans
		un documentfragment
		*/

		/*
		if( !window.HTMLTemplateElement.isNativeTemplate(node) ){
			node.appendChild(this.template.cloneContent());
		}
		*/

		var template = window.Template.new(node);
		template.linkers = this.template.parse();
		template.setModel(model);
	},

	unlink: function(node, model){
		// faudras détruire le template
	}
});

Parser.register(function parseSubTemplate(node){
	if( node.nodeType != 1 ) return false;
	if( !window.HTMLTemplateElement.isTemplate(node) ) return false;
	return SubTemplateLinker.new(node);
});

