NS.Keynav = {
	// rootElement
	root: null,
	//current: null,

	// keynav
	loop: false,
	findNext: 'next',
	findPrev: 'previous',
	findFirst: 'first',
	findLast: 'last',
	findLoop: 'node',

	keys: {
		home: function(){
			return this.find(this.findFirst);
		},

		end: function(){
			return this.find(this.findLast);
		},

		left: function(){
			return this.find('parent');
		},

		right: function(){
			return this.find('firstChild');
		},

		down: function(){
			return this.find(this.findNext, this.loop);
		},

		up: function(){
			return this.find(this.findPrev, this.loop);
		},

		pageup: function(){
			return this.findCount(this.findPrev);
		},

		pagedown: function(){
			return this.findCount(this.findNext);
		},

		'*': function(e){
			// avoid conflict with shortcut like ctrl+a, ctrl+c
			if( e.control ){
				return null;
			}
			else{
				return this.find(this.findNext, true, function(node){
					return this.startBy(node, e.key);
				});
			}
		}
	},

	create: function(root){
		this.root = root;
		this.iterator = this.createIterator();
		this.attach();
	},

	destroy: function(){
		this.detach();
	},

	createIterator: function(){
		return NS.NodeIterator.new(this.root, this);
	},

	// naviguation allowed on child or on descendant
	setChildOnly: function(bool){
		if( bool ){
			this.findNext = 'nextSibling';
			this.findPrev = 'previousSibling';
			this.findFirst = 'firstChild';
			this.findLast = 'lastChild';
			this.findLoop = 'sibling';
		}
		else{
			this.findNext = 'next';
			this.findPrev = 'previous';
			this.findFirst = 'first';
			this.findLast = 'last';
			this.findLoop = 'node';
		}
	},

	find: function(direction, loop, filter){
		if( !loop && !filter ){
			if( direction == this.findFirst || direction == this.findLast ){
				this.iterator.current = this.iterator.root;
			}

			return this.iterator[direction]();
		}

		if( loop ){
			filter = filter || Function.TRUE;

			return this.iterator.iterate(filter, this, direction, loop);
		}

		return null;
	},

	findCount: function(direction){
		var node = null, count = this.getPageCount(this.iterator.current);

		while( this.find(direction) ){
			node = this.iterator.current;
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

	acceptNode: function(node){
		return node != this.root;
	},

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
