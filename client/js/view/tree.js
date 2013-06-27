var Tree = NS.viewDocument.define('tree', {
	tagName: 'ul',
	className: 'tree root unselectable',
	attributes: {
		'tabindex': 0,
	},
	events: {
		'mouseover': function(e){
			var view = this.cast(e.target);

			// when light only occur on the name element
			if( view != this && this.hasClass('compact') && e.target != view.getDom('name') ){
				view = this;
			}

			if( view == this ){
				if( this.lighted ) this.lighted.unlight(e);
			}
			else{
				view.light(e);
			}
		},

		'mouseout': function(e){
			if( this.lighted ){
				// when the mouse go very fast out of the view mouseover event is'nt fired
				// on other view (event the parent view)
				// but we can check the relatedTarget to see if the mouse go out of all view
				var view = this.cast(e.relatedTarget);

				if( !this.contains(view) ){
					this.lighted.unlight(e);
				}
			}
		},

		mousedown: function(e){
			var view = this.cast(e);

			if( e.target.hasClass('tool') ){
				view.toggleState('expanded', e);
			}

			this.selection.selectNode(view, e);
			view.focus(e);
		},

		click: function(e){
			var view = this.cast(e);

			if( view == this ){
				this.selection.removeAll(e);
			}
			else{
				this.selection.collapse(view, e);
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
				this.selection.addRange(this.getFirst(this.isSelectable, this, true), e);
				e.preventDefault();
			}
			else{
				// need String(e.key) because the 0-9 key return numbers
				var key = String(e.key), method;

				if( key in this.keys ){
					method = key;
				}
				else if( key.length == 1 && RegExp.ALPHANUM.test(key) ){
					method = '*';
				}

				if( method ){
					this.target = null;

					this.keys[method].call(this, e);
					if( this.target ){
						this.go(this.target, e);
						e.preventDefault();
					}
				}
			}
		}
	},
	// listening own events
	listeners: {
		light: function(e){
			if( this.lighted ) this.lighted.unlight(e.args[0]);
			this.lighted = e.target;
		},

		unlight: function(e){
			this.lighted = null;
		},

		'expand': function(e){
			var view = e.target;
			if( !view.getChildrenElement() ) view.renderChildren();
		},

		'focus': function(e){
			if( this.focused ) this.focused.blur(e);
			this.focused = e.target;
		},

		'blur': function(e){
			this.focused = null;
		},

		'select': function(e){
			this.selection.removeAll(e.args[0]);
			this.selection.range.push(e.target);
		},

		'unselect': function(e){
			this.selection.range.remove(e.target);
		},

		destroy: function(e){
			if( e.target.hasClass('lighted') ) e.target.unlight(e);
			if( e.target.hasClass('focused') ) e.target.blur(e);
			if( e.target.hasClass('selected') ) e.target.unselect(e);
		},

		'insertElement': function(e){
			var view = e.target, padding;

			this.changeVisibility(e.target, false);

			if( view != this ){
				padding = this.padding * this.getLevel(view);
				view.getDom('div').style.paddingLeft = padding + 'px';
				if( !view.hasChildNodes() ){
					view.addClass('empty');
				}
			}
		},

		'removeElement': function(e){
			this.changeVisibility(e.target, true);
		},

		'hide': function(e){
			this.changeVisibility(e.target, true);
		},

		'show': function(e){
			this.changeVisibility(e.target, false);
		}
	},
	lighted: null,
	focused: null,
	selection: null,
	target: null,
	padding: 18,

	constructor: function(){
		NS.View.constructor.apply(this, arguments);

		this.listener = NS.Listener.new(this, this.listeners, this);
		this.listener.listen();

		this.selection = NS.Selection.new(this);
		this.selection.filterNode = function(view){
			return view.isVisible();
		};
	},

	getChildrenElement: function(){
		return this.element;
	},

	isViewVisible: function(view){
		return !view.hasClass('hidden');
	},

	changeVisibility: function(view, hidden){
		var prev, next, parent = view.parentNode;

		if( parent ){
			prev = view.getPreviousSibling(this.isViewVisible);
			next = view.getNextSibling(this.isViewVisible);

			if( prev && next === null ) prev.toggleClass('last', hidden);
			else if( next && prev === null ) next.toggleClass('first', hidden);
			view.toggleClass('first', Boolean(prev) == Boolean(hidden));
			view.toggleClass('last', Boolean(next) == Boolean(hidden));

			// ajout d'un enfant visible
			if( !hidden ) parent.removeClass('empty');
			// suppression du dernier enfant visible
			else if( prev === null && next === null ) parent.addClass('empty');
		}
	},

	getLevel: function(view){
		var level = -1;

		while(view != this){
			level++;
			view = view.parentNode;
		}

		return level;
	}
});

Object.append(Tree, {
	loop: false,
	target: null,
	keys: {
		enter: function(e){
			this.focused.active(e);
		},

		left: function(e){
			if( this.focused.hasClass('expanded') ){
				this.focused.contract(e);
			}
			else{
				this.target = this.focused.getParent(this.isSelectable, this);
			}
		},

		right: function(e){
			if( this.focused.hasClass('expanded') ){
				this.target = this.focused.getFirstChild(this.isSelectable, this);
			}
			else{
				this.focused.expand(e);
			}
		},

		home: function(){
			this.target = this.getFirst(this.isSelectable, this);
		},

		end: function(){
			this.target = this.getLast(this.isSelectable, this);
		},

		up: function(){
			this.target = this.find(this.focused, this.isSelectable, this, 'prev', this.loop);
		},

		down: function(){
			this.target = this.find(this.focused, this.isSelectable, this, 'next', this.loop);
		},

		'*': function(e){
			// avoid conflict with shortcut like ctrl+a, ctrl+c
			if( e.control ) return;

			this.target = this.find(this.focused, function(node){
				return this.isSelectable(node) && this.matchLetter(node, e.key);
			}, this, 'next', true);

		},

		pageup: function(){
			this.target = this.findAfterCount(this.focused, this.isSelectable, this, 'prev', this.getPageCount(this.current));
		},

		pagedown: function(){
			this.target = this.findAfterCount(this.focused, this.isSelectable, this, 'next', this.getPageCount(this.current));
		}
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

	isSelectable: function(view){
		return view != this && view.isVisible() && !view.hasClass('disabled');
	},

	go: function(view, e){
		if( view ){
			this.selection.selectNode(view, e);
			view.focus(e);
			return true;
		}
		return false;
	},

	getLine: function(element){
		if( !element ) return 0;

		// on fait -1 parce que dans le CSS on a mit un margin-top:-1px pour éviter le chevauchement des bords des noeuds
		return element.getChild('div').measure('size', 'y') - 1;
	},

	matchLetter: function(view, letter){
		var name = view.getDom('name');
		return name && name.innerHTML.startsWith(letter);
	},

	getPageCount: function(view){
		var element = view.element;
		var total = element.offsetParent.clientHeight;
		var count = parseInt(total / this.getLine(element), 10) - 1;

		return count;
	}
});

/*

Normalement la sélection est un ensemble de range
chaque range correspond à une portion sélectionné
un range peut très bien être composé d'un seul noeud
lorsque deux range se croise il fusionne pour en devenir un seul

pour le moment on simplifie comme suit

*/

NS.Selection = {
	node: null,
	startNode: null,
	endNode: null,
	range: null,

	constructor: function(node, single){
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

		if( from === null || to === null ){
			return range;
		}
		if( from == to ){
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
