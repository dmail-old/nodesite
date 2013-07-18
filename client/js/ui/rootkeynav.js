NS.RootKeynav = NS.Keynav.extend({
	keys: NS.Keynav.keys.extend({
		enter: function(e){
			if( this.iterator.current != this.root ){
				this.iterator.current.active(e);
			}
		},

		left: function(e){
			var node = this.iterator.current;

			if( node != this.root && node.firstChild && node.hasClass('expanded') ){
				node.contract(e);
				// lorsqu'il y a une scrollbar évite que le browser la déplace
				e.preventDefault();
				return null;
			}

			return NS.Keynav.keys.left.call(this, e);
		},

		right: function(e){
			var node = this.iterator.current;

			if( node != this.root && node.firstChild && !node.hasClass('expanded') ){
				node.expand(e);
				e.preventDefault();
				return null;
			}

			return NS.Keynav.keys.right.call(this, e);
		}
	}),

	getName: function(node, name){
		return node.model.get('name');
	},

	getHeight: function(node){
		return node.element.getFirstChild('div').measure('size', 'y') - 1;
	},

	acceptNode: function(node){
		return node != this.root && node.isVisible() && !node.hasClass('disabled');
	},

	onnav: function(node, e){
		this.root.selection.selectNode(node, e);
		node.focus(e);
	}
});
