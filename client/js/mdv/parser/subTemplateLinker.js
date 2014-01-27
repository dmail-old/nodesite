window.SubTemplateLinker = window.Linker.extend({
	name: 'SubTemplateLinker',
	terminal: true,
	template: null,

	create: function(templateElement){
		this.template = window.Template.new(templateElement);
	},

	link: function(node, model){
		if( node.childNodes.length === 0 && this.template.content.childNodes.length !== 0 ){
			node.appendChild(this.template.cloneContent());
		}
		/*
		explanation of the previous if:
		
		calling Template.new(node)
		put node.childNodes in a documentfragment
		the next time link is called node.childNodes is empty
		so we need to repopulate childNodes with the original childNodes

		native template doesn't need that because their contents is also
		cloned when doing content.cloneNode(true)
		*/

		if( this.modelPath ){
			this.checkAttributes(node);
		}

		var template = window.Template.new(node);
		template.linkers = this.template.getLinkers();
		template.setModel(model);
	},

	unlink: function(node, model){
		node.template.destroy();
		node.template = null;
	},

	checkAttributes: function(node){
		window.TemplateIterator.forEachInputs(node, function(name, value){
			var parts = window.TemplateIterator.parseAttributeValue.call(window.TemplateIterator, name, value);

			parts[0] = this.getNamedScopePath(
				parts[0],
				this.modelPath,
				this.modelPathAlias
			);

			node.setAttribute(name, parts.join(' '));

		}, this);

		if( !node.hasAttribute('bind') && !node.hasAttribute('repeat') ){
			// je suis censé propager namedScope au subtemplate
		}
	},

	namedScope: function(path, replace){
		this.modelPath = path;
		this.modelPathAlias = replace;
	}
});

window.Parser.register(function parseSubTemplate(node){
	if( window.HTMLTemplateElement.isTemplate(node) ){
		return window.SubTemplateLinker.new(node);
	}
});