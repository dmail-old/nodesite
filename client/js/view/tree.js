NS.viewDocument.define('tree', NS.viewDocument.require('rootnode').extend({
	template: '<ul class="root unselectable" tabindex="0"></ul>',
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
	padding: 18,
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

	getChildrenElement: function(){
		return this.element;
	},

	indentNode: function(node){
		var padding = this.padding, level = this.getLevel(node);

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

/*

Normalement la sélection est un ensemble de range
chaque range correspond à une portion sélectionné
un range peut très bien être composé d'un seul noeud
lorsque deux range se croise il fusionne pour en devenir un seul

pour le moment on simplifie comme suit

*/

NS.Selection = {
	startNode: null,
	endNode: null,
	range: null,

	create: function(node){
		this.startNode = node;
		this.endNode = node;
		this.range = [];
	},

	filterNode: Function.TRUE,

	selectNode: function(node, e){
		if( e.control ){
			if( e.type != 'keydown' ){
				node.toggleState('selected', e);
			}
		}
		else{
			if( node.hasClass('selected') ){
				this.removeAll(e);
			}

			node.select(e);

			if( e.shift ){
				if( this.startNode != this.node ) this.startNode.select(e);
				this.extend(node, e);
			}
			else{
				this.startNode = node;
			}
		}
	},

	removeAll: function(e){
		// n'unselect pas si control ou shift appuyé, ou mousemove aussi normalement
		if( e && (e.control || e.shift) ) return;

		var range = this.range, i = range.length;
		while(i--) range[0].unselect(e);
	},

	collapse: function(node, e){
		if( this.contains(node) ){
			this.range.remove(node);
			this.removeAll(e);
			this.range.push(node);
		}
		else{
			this.removeAll(e);
		}
	},

	extend: function(node, e){
		if( node ){
			this.endNode = node;
			this.setRange(this.getRange(), e);
		}
	},

	contains: function(node){
		return this.range.contains(node);
	},

	addRange: function(range, e){
		range.forEach(function(view){
			view.select(e);
		});
	},

	removeRange: function(range, e){
		range.forEach(function(view){
			view.unselect(e);
		});
	},

	setRange: function(range, e){
		// get selecteds view not in range
		var unselectList = this.range.filter(function(node){
			if( node === this.startNode ) return false;
			if( node === this.endNode ) return false;
			return !range.contains(node);
		}, this);

		// unselect view not in the range
		this.removeRange(unselectList, e);

		// select view in the range
		this.addRange(range, e);
	},

	getRange: function(){
		var from = this.startNode, to = this.endNode, range = [];

		if( from === null || to === null || from === to ){
			return range;
		}

		// respect order
		if( from.compareDocumentPosition(to) & NS.NodeInterface.PRECEDING ){
			from = this.endNode;
			to = this.startNode;
		}

		// get valid nodes between from and to
		while(from = from.getNext(this.filterNode)){
			if( from === to ) break;
			range.push(from);
		}

		return range;
	}
};

