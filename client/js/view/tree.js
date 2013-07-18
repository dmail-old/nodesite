/*

prochaines étapes:

restaurer sort (possibilité de trier les enfants d'un noeud)
restaurer le drag&drop
restaurer memory

*/

NS.viewDocument.define('tree', NS.viewDocument.require('rootnode').extend({
	template: '<ul class="root" tabindex="0" data-indent="18"></ul>',
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

			if( node == null || node == this ) return;

			if( e.target.hasClass('tool') ){
				node.toggleState('expanded', e);
			}

			this.edit(node);

			node.focus(e);
		},

		dblclick: function(e){
			// le futur menu contextuel doit prendre le pas sur ce dblclick
			if( !e.target.hasClass('tool') ){
				var node = this.cast(e);

				if( node != this ) node.toggleState('expanded', e);
			}
		},

		focus: function(e){

		},

		blur: function(e){

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

		// ne peut t-on pas s'inspirer de ça?
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
		// section manipulating DOM Node
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
				this.keynav.current = this.focused;
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
		this.selection.filter = this.isSelectable;
		this.selection.getTarget = function(e){
			return this.root.cast(e);
		};

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
	},

	edit: function(node){
		NS.Editable.new(node.getDom('span'));
	}
}));
