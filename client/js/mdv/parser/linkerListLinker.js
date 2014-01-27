var LinkerListLinker = window.Linker.extend({
	name: 'LinkerListLinker',
	list: null,

	create: function(list){
		this.list = list;
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
	},

	namedScope: function(path, replace){
		var list = this.list, i = 0, j = list.length;
		for(;i<j;i++){
			list[i].namedScope(path, replace);
		}
	}
});

window.Parser.register(function parseAttributes(node){
	if( node.nodeType != 1 ) return false;

	var attributes = node.attributes, i = 0, j = attributes.length, attr, linker, linkerlist = [];

	for(;i<j;i++){
		attr = attributes[i];
		linker = window.AttributeLinker.new(attr.name, attr.value);
		if( linker ){
			linkerlist.push(linker);
		}
	}

	if( linkerlist.length === 0 ) return false;
	if( linkerlist.length === 1 ) return linkerlist[0];
	return window.LinkerListLinker.new(linkerlist);
});