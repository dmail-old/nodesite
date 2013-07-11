/*

Normalement la sélection est un ensemble de range
chaque range correspond à une portion sélectionné
un range peut très bien être composé d'un seul noeud
lorsque deux range se croise il fusionne pour en devenir un seul

pour le moment on simplifie comme suit

*/

NS.Selection = {
	root: null,
	startNode: null,
	endNode: null,
	range: null,
	events: ['mousedown', 'click', 'keydown'],

	create: function(node){
		this.root = node;
		this.startNode = node;
		this.endNode = node;
		this.range = [];

		this.attach();
	},

	destroy: function(){
		this.detach();
	},

	attach: function(){
		this.root.addClass('unselectable');
		this.events.forEach(function(name){ this.root.addEventListener(name, this); }, this);
	},

	detach: function(){
		this.root.removeClass('unselectable');
		this.events.forEach(function(name){ this.root.removeEventListener(name, this); }, this);
	},

	mousedown: function(e){
		var node = this.getTarget(e);

		if( node == this.root ){

		}
		else{
			this.selectNode(node, e);
		}
	},

	click: function(e){
		var node = this.getTarget(e);

		if( node == this.root ){
			this.removeAll(e);
		}
		else{
			this.collapse(node, e);
		}
	},

	keydown: function(e){
		if( e.control && e.key == 'a' ){
			// sélectionne tout ce qui est sélectionnable
			this.addRange(this.root.getFirst(this.filter, this, true), e);
			e.preventDefault();
		}
	},

	handleEvent: function(e){
		this[e.type](e);
	},

	getTarget: function(e){
		return e.target;
	},

	filter: Function.TRUE,

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
		while(from = from.getNext(this.filter)){
			if( from === to ) break;
			range.push(from);
		}

		return range;
	}
};