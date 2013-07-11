/*

prochaines étapes:

restaurer sort (possibilité de trier les enfants d'un noeud)
restaurer le drag&drop
restaurer le rename par f2
restaurer memory

*/

NS.viewDocument.define('tree', NS.viewDocument.require('rootnode').extend({
	template: '<ul class="root unselectable" tabindex="0" data-indent="18"></ul>',
	events: {
		mouseover: function(e){
			var node = this.cast(e.target);

			//this.hasClass('compact') &&  e.target == view.getDom('name')

			if( node === null || node === this ){
				if( this.lighted ) this.lighted.unlight(e);
			}
			else{
				node.light(e);
			}
		},

		mouseout: function(e){
			if( this.lighted && !this.element.contains(e.relatedTarget) ){
				this.lighted.unlight(e);
			}
		},

		mousedown: function(e){
			var node = this.cast(e);

			if( node == this ){
				return;
			}

			if( e.target.hasClass('tool') ){
				node.toggleState('expanded', e);
			}

			if( node ){
				this.selection.selectNode(node, e);
				node.focus(e);
			}
		},

		click: function(e){
			var node = this.cast(e);

			if( node == this ){
				this.selection.removeAll(e);
			}
			else{
				this.selection.collapse(node, e);
			}
		},

		dblclick: function(e){
			// le futur menu contextuel doit prendre le pas sur ce dblclick
			if( !e.target.hasClass('tool') ){
				var node = this.cast(e);

				if( node != this ) node.toggleState('expanded', e);
			}
		},

		keydown: function(e){
			if( e.control && e.key == 'a' ){
				// sélectionne tout ce qui est sélectionnable
				this.selection.addRange(this.getFirst(this.isSelectable, this, true), e);
				e.preventDefault();
			}
			else{
				this.keynav.current = this.focused;
				this.keynav.keydown(e);
			}
		}
	},
	lighted: null,
	focused: null,

	create: function(){
		NS.viewDocument.require('rootnode').create.apply(this, arguments);

		// indent
		this.emitter.on('insertElement', function(e){
			this.indentNode(e.target);
		});

		// lighted
		this.on({
			light: function(e){
				if( this.lighted ) this.lighted.unlight(e.args[0]);
				this.lighted = e.target;
			},

			unlight: function(e){
				this.lighted = null;
			},

			destroy: function(e){
				var node = e.target;

				if( node.hasClass('lighted') ) node.unlight(e);
			}
		});

		// focused
		this.on({
			focus: function(e){
				if( this.focused ) this.focused.blur(e);
				this.focused = e.target;
			},

			blur: function(e){
				this.focused = null;
			},

			destroy: function(e){
				var node = e.target;
				if( node.hasClass('focused') ) node.blur(e);
			}
		});

		// selection
		this.selection = NS.Selection.new(this);
		this.selection.filterNode = this.isSelectable;
		this.on({
			select: function(e){
				this.selection.removeAll(e.args[0]);
				this.selection.range.push(e.target);
			},

			unselect: function(e){
				this.selection.range.remove(e.target);
			},

			destroy: function(e){
				var node = e.target;

				if( node.hasClass('selected') ) node.unselect(e);
			}
		});
	},

	indentNode: function(node){
		var padding = this.getAttribute('data-indent'), level = this.getLevel(node);

		if( level > -1 ){
			node.getDom('div').style.paddingLeft = (padding * level) + 'px';
		}
	},

	getLevel: function(node){
		var level = -1;

		while(node != this){
			level++;
			node = node.parentNode;
		}

		return level;
	}
}));
