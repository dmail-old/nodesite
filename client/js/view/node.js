NS.NodeTreeView = NS.TreeView.extend(NS.viewstate, {
	tagName: 'li',
	innerHTML: '<div><ins class="tool"></ins><span class="name">{name}</span></div>',
	className: 'node',
	listeners: {
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

	createClassList: function(){
		var classList = NS.TreeView.createClassList.call(this);

		if( this.isEmpty() ){
			classList.add('empty');
			classList.add('expanded');
		}

		//if( this.has('class') ) classList.add(this.get('class'));

		return classList;
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
