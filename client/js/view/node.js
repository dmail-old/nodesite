var exports = {
	tagName: 'li',
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
	isEmpty: function(){
		return this.children.length === 0;
	},

	getClassName: function(){
		var className = NS.NodeView.getClassName.call(this);

		if( this.isEmpty() ){
			className.add('empty');
			className.add('expanded');
		}

		//if( this.has('class') ) className+= ' ' + this.get('class');

		return className;
	},

	scrollTo: function(dom){
		var element = this.getDom(typeof dom == 'string' ? dom : 'li');
		if( element ) element.keepIntoView();

		return this;
	},

	getHTML: function(){
		return '<div><ins class="tool"></ins><span class="name">' + this.model.name + '</span></div>';
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
};

exports = NS.TreeView.extend(NS.viewstate, exports);
NS.NodeTreeView = exports;
