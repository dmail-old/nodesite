var Tree = NS.viewDocument.define('tree', NS.View.extend({
	tagName: 'ul',
	className: 'tree root unselectable',
	attributes: {'tabindex': 0},
	lighted: null,
	focused: null,
	selection: null,

	create: function(){
		NS.View.create.apply(this, arguments);

		// expand
		this.emitter.on({
			expand: function(e){
				var view = e.target;
				if( !view.getChildrenElement() ) view.renderChildren();
			}
		});
		this.elementEmitter.on({
			mousedown: function(e){
				if( e.target.hasClass('tool') ){
					this.cast(e).toggleState('expanded', e);
				}
			},

			keydown: function(e){
				var node = this.focused.focused;

				if( e.key == 'left' && node.hasClass('expanded') ){
					node.contract(e);
					// lorsqu'il y a une scrollbar évite que le browser la déplace
					e.preventDefault();
				}
				else if( e.key == 'right' && !node.hasClass('expanded') ){
					node.expand(e);
					e.preventDefault();
				}
			}
		});

		// cssposition
		this.cssPosition = this.plugin('cssPosition').new(this);
		this.emitter.on({
			insertElement: function(e){ this.cssPosition.changeStructure(e.target); },
			show: function(e){ this.cssPosition.changeStructure(e.target); },
			removeElement: function(e){ this.cssPosition.changeStructure(e.target, true); },
			hide: function(e){ this.cssPosition.changeStructure(e.target, true); },
		});

		// indent
		this.indent = this.plugin('indent').new(this);
		this.indent.root = this;
		this.emitter.on({
			insertElement: function(e){
				this.indent.indentNode(e.target);
			}
		});

		// lighted
		this.lighted = this.plugin('lighted').new(this);
		this.elementEmitter.on({
			mouseover: function(e){
				var node = this.cast(e.target);

				//this.hasClass('compact') &&  e.target == view.getDom('name')

				if( node === null || node === this ){
					this.lighted.unlight(e);
				}
				else{
					this.lighted.light(node, e);
				}
			},

			mouseout: function(e){
				var node;

				if( this.lighted.lighted != null ){
					// when the mouse go very fast out of the view mouseover event is'nt fired
					// on other view (event the parent view)
					// but we can check the relatedTarget to see if the mouse go out of all view
					node = this.cast(e.relatedTarget);

					if( !this.contains(node) ){
						this.lighted.unlight(e);
					}
				}
			}
		});

		// focused
		this.focused = this.plugin('focused').new(this);
		this.elementEmitter.on({
			mousedown: function(e){
				var node = this.cast(e);
				if( node ) node.focus(e);
			}
		});

		// selection
		this.selection = this.plugin('selection').new(this);
		this.selection.filterNode = this.isSelectable;
		this.elementEmitter.on({
			mousedown: function(e){
				var node = this.cast(e);
				if( node ) this.selection.selectNode(node, e);
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
					this.cast(e).toggleState('expanded', e);
				}
			},

			keydown: function(e){
				if( e.control && e.key == 'a' ){
					// sélectionne tout ce qui est sélectionnable
					this.selection.addRange(this.getFirst(this.isSelectable, this, true), e);
					e.preventDefault();
				}
			}
		});

		// nav
		this.keynav = this.plugin('keynav').new(this);
		this.elementEmitter.on({
			keydown: function(e){
				var target = this.keynav.nav(this.focused.focused, e);

				if( target ){
					this.selection.selectNode(target, e);
					target.focus(e);
					e.preventDefault();
				}
			}
		});
	},

	plugin: function(name){
		return NS.Plugin.plugins[name];
	},

	isSelectable: function(view){
		return view != this && view.isVisible() && !view.hasClass('disabled');
	},

	getChildrenElement: function(){
		return this.element;
	}
}));

NS.Plugin = {
	listeners: null,
	plugins: {},

	create: function(view){
		this.view = view;
		this.listener = NS.EventListener.new(view, this.listeners, this);
		this.listener.listen();
	},

	define: function(name, object){
		return this.plugins[name] = this.extend(object);
	},

	destroy: function(){
		this.view = null;
		this.listener.stopListening();
		this.listener = null;
	}
};

NS.Plugin.define('indent', {
	value: 18,
	root: null,

	indentNode: function(node){
		var padding = this.value, level = this.getLevel(node);

		if( level > -1 ){
			node.getDom('div').style.paddingLeft = (padding * level) + 'px';
		}
	},

	getLevel: function(node){
		var level = -1;

		while(node != this.root){
			level++;
			node = node.parentNode;
		}

		return level;
	}
});

NS.Plugin.define('lighted', {
	lighted: null,
	listeners: {
		light: function(e){
			if( this.lighted ) this.lighted.unlight(e.args[0]);
			this.lighted = e.target;
		},

		unlight: function(e){
			this.lighted = null;
		},

		destroy: function(e){
			if( e.target.hasClass('lighted') ) e.target.unlight(e);
		}
	},

	light: function(node, e){
		node.light(e);
	},

	unlight: function(e){
		if( this.lighted ) this.lighted.unlight(e);
	}
});

NS.Plugin.define('focused', {
	focused: null,
	listeners: {
		focus: function(e){
			if( this.focused ) this.focused.blur(e);
			this.focused = e.target;
		},

		blur: function(e){
			this.focused = null;
		},

		destroy: function(e){
			if( e.target.hasClass('focused') ) e.target.blur(e);
		}
	}
});

NS.Plugin.define('keynav', {
	loop: false,
	keys: {
		enter: function(node, e){
			node.active(e);
		},

		left: function(node){
			return node.getParent(this.isSelectable, this);
		},

		right: function(node){
			return node.getFirstChild(this.isSelectable, this);
		},

		home: function(node){
			return this.view.getFirst(this.isSelectable, this);
		},

		end: function(node){
			return this.view.getLast(this.isSelectable, this);
		},

		up: function(node){
			return this.find(node, this.isSelectable, this, 'prev', this.loop);
		},

		down: function(node){
			return this.find(node, this.isSelectable, this, 'next', this.loop);
		},

		pageup: function(node){
			return this.findAfterCount(node, this.isSelectable, this, 'prev', this.getPageCount(this.current));
		},

		pagedown: function(node){
			return this.findAfterCount(node, this.isSelectable, this, 'next', this.getPageCount(this.current));
		},

		'*': function(node, e){
			// avoid conflict with shortcut like ctrl+a, ctrl+c
			if( e.control ){
				return null;
			}
			else{
				return this.find(node, function(node){
					return this.isSelectable(node) && this.matchLetter(node, e.key);
				}, this, 'next', true);
			}
		}
	},

	nav: function(node, e){
		// need String(e.key) because the 0-9 key return numbers
		var key = String(e.key), method, target = null;

		if( key in this.keys ){
			method = key;
		}
		else if( key.length == 1 && RegExp.ALPHANUM.test(key) ){
			method = '*';
		}

		if( method ){
			target = this.keys[method].call(this, node, e);
		}

		return target;
	},

	find: function(startNode, filter, bind, direction, loop){
		var result = null;

		result = startNode[direction == 'next' ? 'getNext' : 'getPrevious'](filter, bind);

		if( result === null && loop === true ){
			this[direction == 'next' ? 'getFirst' : 'getLast'](function(node){
				if( node == startNode ) return true;
				if( filter.call(this, node) === true ){
					result = node;
					return true;
				}
			}, bind);
		}

		return result;
	},

	findAfterCount: function(node, filter, bind, direction, count){
		var lastMatch = null;

		this.find(node, function(node){
			if( filter.call(this, node) === true ){
				lastMatch = node;
				// on est arrivé au bout du compteur, stoppe la boucle
				if( count === 0 ) return true;
				count--;
			}
			else{
				return false;
			}
		}, bind, direction);

		return lastMatch;
	},

	matchLetter: function(view, letter){
		var name = view.getDom('name');
		return name && name.innerHTML.startsWith(letter);
	},

	getLine: function(element){
		if( !element ) return 0;

		// on fait -1 parce que dans le CSS on a mit un margin-top:-1px pour éviter le chevauchement des bords des noeuds
		return element.getFirstChild('div').measure('size', 'y') - 1;
	},

	getPageCount: function(view){
		var element = view.element, total = element.offsetParent.clientHeight;

		return parseInt(total / this.getLine(element), 10) - 1;
	}
});

NS.Plugin.define('cssPosition', {
	isVisible: function(node){
		return !node.hasClass('hidden');
	},

	changeStructure: function(node, hidden){
		var prev, next, parent = node.parentNode;

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
});

/*

Normalement la sélection est un ensemble de range
chaque range correspond à une portion sélectionné
un range peut très bien être composé d'un seul noeud
lorsque deux range se croise il fusionne pour en devenir un seul

pour le moment on simplifie comme suit

*/

NS.Plugin.define('selection', {
	listeners: {
		select: function(e){
			this.removeAll(e.args[0]);
			this.range.push(e.target);
		},

		unselect: function(e){
			this.range.remove(e.target);
		},

		destroy: function(e){
			if( e.target.hasClass('selected') ) e.target.unselect(e);
		}
	},

	node: null,
	startNode: null,
	endNode: null,
	range: null,

	create: function(node){
		NS.Plugin.create.apply(this, arguments);

		this.node = node;
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
});
