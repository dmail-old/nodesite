NS.NodeTreeView = NS.TreeView.extend(NS.viewstate, {
	tagName: 'li',
	innerHTML: '<div><ins class="tool"></ins><span class="name">{name}</span></div>',
	className: 'node',
	modelEvents: {
		'change:name': function(name){
			this.updateName(name);
		}
	},

	getChildrenElement: function(){
		return this.getDom('ul');
	},

	// NOTE: will be override by FileNodeView -> should not be considered empty until loaded
	// this function will surely be names hasChildren and transferred in childrenInterface
	isEmpty: function(){
		return this.children.length === 0;
	},

	createElement: function(){
		if( this.isEmpty() ){
			this.classList.add('empty');
			this.classList.add('expanded');
		}

		return NS.TreeView.createElement.call(this);
	},

	scrollTo: function(dom){
		var element = this.getDom(typeof dom == 'string' ? dom : 'li');
		if( element ) element.keepIntoView();

		return this;
	},

	getDom: function(what){
		var dom;

		switch(what){
		case 'li':
			return this.element;
		case 'ul':
		case 'div':
			dom = this.getDom('li');
			return dom ? dom.getChild(what) : null;
		case 'name':
			dom = this.getDom('div');
			return dom ? dom.getChild('span') : null;
		default:
			dom = this.getDom('div');
			return dom ? dom.getChild(what) : null;
		}
	},

	updateName: function(name){
		this.getDom('name').innerHTML = name;
	}
});
