NS.viewDocument.define('rootnode', NS.View.create({
	keynav: null,

	create: function(){
		NS.View.create.apply(this, arguments);

		// expand
		this.emitter.on('expand', function(e){
			var node = e.target;
			if( !node.getChildrenElement() ) this.renderChildren(node);
		});

		// cssposition
		this.emitter.on('insertElement show removeElement hide', this.changeStructure);

		this.keynav = NS.RootKeynav.new(this);
	},

	getChildrenElement: function(){
		return this.element;
	},

	getHeight: function(node){
		return node.element.getFirstChild('div').measure('size', 'y') - 1;
	},

	//expand
	insertChildren: function(node, element){
		node.childNodes.forEach(function(child){ child.insertElement(element); });
	},

	renderChildren: function(node){
		var childrenElement = document.createElement('ul');
		node.element.appendChild(childrenElement);
		this.insertChildren(node, childrenElement);
	},

	// cssposition
	isVisible: function(node){
		return !node.hasClass('hidden');
	},

	changeStructure: function(e){
		var node = e.target, prev, next, parent = node.parentNode, hidden;

		hidden = e.type == 'removeElement' || e.type == 'hide';

		if( parent ){
			prev = node.getPreviousSibling(this.isVisible);
			next = node.getNextSibling(this.isVisible);

			if( prev && next === null ) prev.toggleClass('last', hidden);
			else if( next && prev === null ) next.toggleClass('first', hidden);
			node.toggleClass('first', Boolean(prev) == Boolean(hidden));
			node.toggleClass('last', Boolean(next) == Boolean(hidden));

			// ajout d'un enfant visible
			if( !hidden ){
				parent.removeClass('empty');
			}
			// suppression du dernier enfant visible
			else if( prev === null && next === null ){
				parent.addClass('empty');
			}
		}

		node.toggleClass('empty', node.firstChild == null);
	}
}));
