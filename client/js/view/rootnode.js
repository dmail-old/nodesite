NS.viewDocument.define('rootnode', NS.View.extend({
	tagName: 'ul',
	className: 'root unselectable',
	focused: null,
	selection: null,

	create: function(){
		NS.View.create.apply(this, arguments);

		// expand
		this.emitter.on('expand', function(e){
			var node = e.target;
			if( !node.getChildrenElement() ) this.renderChildren(node);
		});

		// cssposition
		this.emitter.on('insertElement show removeElement hide', this.changeStructure);
	},

	getChildrenElement: function(){
		return this.element;
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
	},

	// keynav
	loop: false,
	findNext: 'getNext',
	findPrev: 'getPrevious',
	findFirst: 'getFirst',
	findLast: 'getLast',
	keys: {
		enter: function(node, e){
			node.active(e);
		},

		left: function(node, e){
			if( node.hasClass('expanded') ){
				node.contract(e);
				// lorsqu'il y a une scrollbar évite que le browser la déplace
				e.preventDefault();
				return null;
			}

			return node.getParent(this.isSelectable, this);
		},

		right: function(node, e){
			if( !node.hasClass('expanded') ){
				node.expand(e);
				e.preventDefault();
				return null;
			}

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
			return this.findAfterCount(node, this.isSelectable, this, 'prev', this.getPageCount(node));
		},

		pagedown: function(node){
			return this.findAfterCount(node, this.isSelectable, this, 'next', this.getPageCount(node));
		},

		'*': function(node, e){
			// avoid conflict with shortcut like ctrl+a, ctrl+c
			if( e.control ){
				return null;
			}
			else{
				return this.find(node, function(node){
					return this.isSelectable(node) && this.startBy(node, e.key);
				}, this, 'next', true);
			}
		}
	},

	isSelectable: function(view){
		return view != this && view.isVisible() && !view.hasClass('disabled');
	},

	find: function(startNode, filter, bind, direction, loop){
		var result = null;

		result = startNode[direction == 'next' ? this.findNext : this.findPrev](filter, bind);

		if( result === null && loop === true ){
			this[direction == 'next' ? this.findFirst : this.findLast](function(node){
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
				count--;
				// on est arrivé au bout du compteur, stoppe la boucle
				if( count < 1 ) return true;
			}
			else{
				return false;
			}
		}, bind, direction);

		return lastMatch;
	},

	startBy: function(node, letter){
		return node.model.get('name').startsWith(letter);
	},

	getLine: function(node){
		if( !node ) return 0;

		// on fait -1 parce que dans le CSS on a mit un margin-top:-1px pour éviter le chevauchement des bords des noeuds
		return node.element.getFirstChild('div').measure('size', 'y') - 1;
	},

	getPageCount: function(node){
		return parseInt(node.element.offsetParent.clientHeight / this.getLine(node), 10);
	},

	nav: function(node, e){
		var target = this.getKeyTarget(this.focused, e);
		if( target ){
			this.go(target, e);
		}
	},

	getKeyTarget: function(node, e){
		// need String(e.key) because the 0-9 key return numbers
		var key = String(e.key);

		if( key.length == 1 && RegExp.ALPHANUM.test(key) ){
			key = '*';
		}

		if( key in this.keys ){
			return this.keys[key].call(this, node, e);
		}
		return null;
	}
}));
