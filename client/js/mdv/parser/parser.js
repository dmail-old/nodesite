window.Parser = {
	parsers: [],

	collect: function(node, path){
		var found = [], parsers = this.parsers, i = 0, j = parsers.length;
		var nodeType = node.nodeType, linker, terminal = false;

		if( typeof path != 'string' ) path = '';

		for(;i<j;i++){
			linker = parsers[i].call(this, node);
			if( window.Linker.isLinker(linker) ){
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
	}
};