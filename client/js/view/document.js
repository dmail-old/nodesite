

NS.DocumentView = NS.TreeView.extend({
	tagName: 'ul',
	className: 'root',
	attributes: {
		'tabindex': 0,
	},

	constructor: function(){
		this.ownerDocument = this;
		NS.TreeView.constructor.apply(this, arguments);
		this.render();
	},

	getChildItem: function(){
		return NS.NodeTreeView;
	},

	createNode: function(data){
		var constructor = this.getChildItem(), node;

		if( constructor.isPrototypeOf(data) ){
			node = data;
		}
		else{
			node = constructor.new(data);
		}

		if( node.model ){
			node.model.children.forEach(function(child){
				node.appendChild(this.createNode(child));
			}, this);
		}

		node.ownerDocument = this;

		return node;
	},

	getChildrenElement: function(){
		return this.element;
	},

	listenTo: function(e){
		return this.events && this.events.contains(e.type);
	}
});

var events = [
	'mouseover', 'mouseout', 'mousemove',
	'mousedown', 'click', 'dblclick', 'contextmenu',
	'keydown'
];

// on utilisera NS.EventListener pour pouvoir enlever ces events
window.on(events, function(e){
	var view = NS.View.cast(e);

	if( view ){
		if( view.ownerDocument && view.ownerDocument.listenTo(e) ){
			view.bubble(e.type, arguments);
		}
	}
});
