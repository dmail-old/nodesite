NS.Keynav = {
	// rootElement
	root: null,
	// currentElement from wich we nav
	current: null,

	// keynav
	loop: false,
	findNext: 'getNext',
	findPrev: 'getPrevious',
	findFirst: 'getFirst',
	findLast: 'getLast',

	keys: {
		home: function(){
			return this.root[this.findFirst](this.filter, this);
		},

		end: function(){
			return this.root[this.findLast](this.filter, this);
		},

		left: function(){
			return this.current.getParent(this.filter, this);
		},

		right: function(){
			return this.current.getFirstChild(this.filter, this);
		},

		down: function(){
			return this.find(this.current, this.filter, this, this.findNext, this.loop);
		},

		up: function(){
			return this.find(this.current, this.filter, this, this.findPrev, this.loop);
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
				return this.find(this.current, function(node){
					return this.filter(node) && this.startBy(node, e.key);
				}, this, this.findNext, true);
			}
		}
	},

	create: function(root){
		this.root = root;
		this.current = root;
		this.attach();
	},

	destroy: function(){
		this.detach();
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

	getName: function(node){
		return node.nodeName;
	},

	getHeight: function(){
		if( this.root.firstChild ){
			return this.root.firstChild.measure('size', 'y');
		}
		return 0;
	},

	getAvailableHeight: function(node){
		return node.element.offsetParent.clientHeight;
	},	

	startBy: function(node, letter){
		return this.getName(node).charAt(0) == letter;
	},

	getPageCount: function(node){
		return parseInt(this.getAvailableHeight(node) / this.getHeight(), 10);
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

	attach: function(){
		this.root.addEventListener('keydown', this);
	},

	detach: function(){
		this.root.removeEventListener('keydown', this);
	},

	handleEvent: function(e){
		//this.current = this.focused;
		this.keydown(e);
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
