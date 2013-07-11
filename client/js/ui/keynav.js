NS.Keynav = {
	// rootElement
	root: null,
	current: null,

	// keynav
	loop: false,
	findNext: 'getNext',
	findPrev: 'getPrevious',
	findFirst: 'getFirst',
	findLast: 'getLast',

	keys: {
		home: function(){
			this.iterator.current = this.root;
			return this.iterate(this.findFirst);
		},

		end: function(){
			this.iterator.current = this.root;
			return this.iterate(this.findLast);
		},

		left: function(){
			return this.iterate('getParent');
		},

		right: function(){
			return this.iterate('getFirstChild');
		},

		down: function(){
			return this.find(this.findNext, this.loop);
		},

		up: function(){
			return this.find(this.findPrev, this.loop);
		},

		pageup: function(){
			return this.findAfterCount(this.findPrev, this.getPageCount(this.iterator.current));
		},

		pagedown: function(){
			return this.findAfterCount(this.findNext, this.getPageCount(this.iterator.current));
		},

		'*': function(e){
			// avoid conflict with shortcut like ctrl+a, ctrl+c
			if( e.control ){
				return null;
			}
			else{
				return this.find(this.findNext, true, function(node){
					return this.filter(node) && this.startBy(node, e.key);
				});
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

	iterate: function(direction, filter, bind){
		var node = this.current[direction](filter, bind);
		if( node ) this.current = node;
		return node;
	},

	find: function(direction, loop, filter){

		var node = this.iterate(direction, filter || this.filter, this), current;

		if( node == null && loop ){
			current = this.current;
			direction = this.findNext ? this.findFirst : this.findLast;
			node = this.iterate(direction, function(node){
				if( node == current ) return true;
				return filter.call(this, node);
			}, this);
			if( node == current ) node = null;
		}

		return node;
	},

	findAfterCount: function(direction, count){
		var node = null;

		while( node = this.iterate(direction) ){
			count--;
			if( count < 1 ) break;
		}

		return node;
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

	getTarget: function(e){
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
		this.keydown(e);
	},

	keydown: function(e){
		var target = this.getTarget(e);

		if( target ){
			this.go(target, e);
		}
	}	
};
