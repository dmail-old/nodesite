if( typeof HTMLTemplateElement === 'undefined' ){
	var HTMLTemplateElement = function(){
		throw TypeError('Illegal constructor');
	};
	HTMLTemplateElement.supported = false;
}
else{
	HTMLTemplateElement.supported = true;
}

Object.append(HTMLTemplateElement, {
	contentDescriptor: {
		get: function(){
			var fragment = this.ownerDocument.createDocumentFragment();
			while( this.firstChild ){
				fragment.appendChild(this.firstChild);
			}
			return fragment;
		}
	},

	isNativeTemplate: function(node){
		return this.supported && node.tagName == 'TEMPLATE';
	},

	mixin: function(to, from){
		Object.getOwnPropertyNames(from).forEach(function(name) {
			Object.defineProperty(to, name, Object.getOwnPropertyDescriptor(from, name));
		});
	},

	appendPrototype: function(node){
		if( !this.isNativeTemplate(node) ){
			this.mixin(node, HTMLTemplateElement.prototype);
			// redefine 'content' to get the custom content descriptor, not the native one
			if( this.supported ){
				Object.defineProperty(node, 'content', this.contentDescriptor);
			}
		}
	},

	decorate: function(node){
		if( node.templateDecorated ){
			return false;
		}
		this.appendPrototype(node);
		node.templateDecorated = true;
		return true;
	},

	isTemplate: function(node){
		if( node.nodeType != 1 ) return false;
		if( node.hasAttribute('native') ) return false;
		return node.tagName == 'TEMPLATE' || node.hasAttribute('template');
	},

	checkNode: function(node, found){
		if( this.isTemplate(node) ){
			found.push(node);
		}
		else{
			return this.checkChildNodes(node, found);
		}
	},

	checkNodeList: function(nodeList, found){
		var i = 0, j = nodeList.length;
		for(;i<j;i++){
			this.checkNode(nodeList[i], found);
		}
		return found;
	},

	checkChildNodes: function(node, found){
		return this.checkNodeList(node.childNodes, found);
	},

	collect: function(element){
		return this.checkChildNodes(element, []);
	},

	createAll: function(list){
		var i = 0, j = list.length;
		for(;i<j;i++){
			window.Template.new(list[i]);
		}
	},

	bootstrap: function(element){
		this.createAll(this.collect(element));
	}
});

if( typeof window.HTMLUnknownElement === 'undefined' ){
	window.HTMLUnknownElement = window.HTMLElement;
}
if( HTMLTemplateElement.supported === false ){
	HTMLTemplateElement.prototype = Object.create(window.HTMLUnknownElement.prototype);
	Object.defineProperty(HTMLTemplateElement.prototype, 'content', this.contentDescriptor);
}
