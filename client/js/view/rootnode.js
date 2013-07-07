NS.viewDocument.define('rootnode', NS.View.extend({
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

NS.Keynav = {
	root: null,
	// currentNode from wich we nav
	current: null,

	// keynav
	loop: false,
	findNext: 'getNext',
	findPrev: 'getPrevious',
	findFirst: 'getFirst',
	findLast: 'getLast',

	keys: {
		home: function(){
			return this.first();
		},

		end: function(){
			return this.last();
		},

		down: function(){
			return this.next();
		},

		up: function(){
			return this.prev();
		},

		pageup: function(){
			return this.findAfterCount(this.current, this.filter, this, this.findPrev, this.getPageCount(this.current));
		},

		pagedown: function(){
			return this.findAfterCount(this.current, this.filter, this, this.findNext, this.getPageCount(this.current));
		},

		'*': function(e){
			// avoid conflict with shortcut like ctrl+a, ctrl+c
			if( e.control ){
				return null;
			}
			else{
				return this.findLetter(e.key);
			}
		}
	},

	create: function(root){
		this.root = root;
		this.current = root;
	},

	// naviguation allowed on child or on descendant
	setChildOnly: function(bool){
		if( bool ){
			this.findNext = 'getNextSibling';
			this.findPrev = 'getPreviousSibling';
			this.findFirst = 'getFirstChild';
			this.findLast = 'getLastChild';
		}
		else{
			this.findNext = 'getNext';
			this.findPrev = 'getPrevious';
			this.findFirst = 'getFirst';
			this.findLast = 'getLast';
		}
	},

	find: function(startNode, filter, bind, direction, loop){
		var result = null;

		result = startNode[direction](filter, bind);

		if( result === null && loop === true ){
			this[direction == this.findNext ? this.findFirst : this.findLast](function(node){
				if( node == startNode ) return true;
				if( filter.call(this, node) === true ){
					result = node;
					return true;
				}
			}, bind);
		}

		return result;
	},

	findAfterCount: function(startNode, filter, bind, direction, count){
		var lastMatch = null;

		this.find(startNode, function(node){
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

	findLetter: function(letter){
		return this.find(this.current, function(node){
			return this.filter(node) && this.startBy(node, letter);
		}, this, this.findNext, true);
	},

	first: function(){
		return this.find(this.root, this.filter, this, this.findFirst);
	},

	last: function(){
		return this.find(this.root, this.filter, this, this.findLast);
	},

	next: function(){
		return this.find(this.current, this.filter, this, this.findNext, this.loop);
	},

	prev: function(){
		return this.find(this.current, this.filter, this, this.findPrev, this.loop);
	},

	startBy: function(node, letter){
		return this.getName(node).charAt(0) == letter;
	},

	getName: function(node){
		return node.nodeName;
	},

	getPageCount: function(node){
		return parseInt(node.element.offsetParent.clientHeight / this.getHeight(), 10);
	},

	getTarget: function(node, e){
		// need String(e.key) because the 0-9 key return numbers
		var key = String(e.key);

		if( key.length == 1 && RegExp.ALPHANUM.test(key) ){
			key = '*';
		}

		if( key in this.keys ){
			return this.keys[key].call(this, e);
		}
		return null;
	},

	filter: Function.TRUE,
	onnav: Function.EMPTY,

	go: function(node, e){
		this.current = node;
		e.preventDefault();
		this.onnav(node, e);
	},

	keydown: function(e){
		var current = this.current, target;

		if( current ){
			target = this.getTarget(current, e);
			if( target ){
				this.go(target, e);
			}
		}
	}
};

NS.RootKeynav = NS.Keynav.extend({
	keys: NS.Keynav.keys.extend({
		enter: function(e){
			this.current.active(e);
		},

		left: function(e){
			if( this.current.hasClass('expanded') ){
				this.current.contract(e);
				// lorsqu'il y a une scrollbar évite que le browser la déplace
				e.preventDefault();
				return null;
			}

			return this.current.getParent(this.filter, this);
		},

		right: function(e){
			if( !this.current.hasClass('expanded') ){
				this.current.expand(e);
				e.preventDefault();
				return null;
			}

			return this.current.getFirstChild(this.filter, this);
		}
	}),

	getName: function(node, name){
		return node.model.get('name');
	},

	getHeight: function(){
		var node = this.root.firstChild, height = 0;

		// on fait -1 parce que dans le CSS on a mit un margin-top:-1px pour éviter le chevauchement des bords des noeuds
		if( node ){
			height = node.element.getFirstChild('div').measure('size', 'y') - 1;
		}

		return height;
	},

	filter: function(node){
		return node != this.root && node.isVisible() && !node.hasClass('disabled');
	},

	onnav: function(node, e){
		this.root.selection.selectNode(node, e);
		node.focus(e);
	}
});
