/* global StringList, View, ListView */

var NodeView = new Class({
	Extends: View,
	tagName: 'li',
	listeners: {
		//'change:name': NodeView.prototype.updateName
	},

	getAttributes: function(){
		var attr = View.prototype.getAttributes.call(this), className = new StringList();

		if( this.isEmpty() ) className.add('empty');
		//if( this.has('class') ) className+= ' ' + this.get('class');

		attr['class'] = className;

		return attr;
	},

	scrollTo: function(dom){
		var element = this.getDom(typeof dom == 'string' ? dom : 'li');
		if( element ) element.keepIntoView();

		return this;
	},

	adopt: function(view, index){
		// childrenView existe ? suffit d'ajouter une vue enfant
		if( this.childrenView ) this.childrenView.add(view, index);
		// sinon on créer childrenView qui tiendras compte de cette adoption
		else this.createChildrenView();
	},

	createChildrenView: function(element){
		this.childrenView = new NodeListView(this.model.children);

		// IMPORTANT: conserver cet ordre pour que les events des li dans createList remontent bien le DOM par le ul et son parent

		// on crée l'élément ul
		this.childrenView.render();
		// on met le ul dans le DOM
		this.childrenView.append(element || this.element);
		// on crée la liste de li
		this.childrenView.createList();

	},

	isEmpty: function(){
		return this.model.children.length === 0;
	},

	getHTML: function(){
		return '<div><ins></ins><span>' + this.model.name + '</span></div>';
	},

	getDom: function(what){
		switch(what){
		case 'li':
			return this.element;
		case 'ul':
			return this.childrenView.element;
		case 'div':
			return this.element.getChild(what);
		default:
			return this.getDom('div').getChild(what);
		}
	},

	updateName: function(name){
		this.getDom('span').innerHTML = name;
	},

	hasState: function(state){
		return this.element.hasClass(state);
	},

	setState: function(state, value, e){
		if( this.hasState(state) == value ) return false;
		this.element.toggleClass(state, value);
		this.emit(NodeView.states[state][value ? 0 : 1], e);
		return true;
	},

	toggleState: function(state, e){
		return this.setState(state, !this.hasState(state), e);
	},

	eachState: function(fn, bind){
		Object.eachPair(NodeView.states, function(state){
			if( this.hasState(state) ) fn.call(bind, state);
		}, this);
		return this;
	},

	light: function(e){
		return this.setState('lighted', true, e);
	},

	unlight: function(e){
		return this.setState('lighted', false, e);
	},

	select: function(e){
		return this.setState('selected', true, e);
	},

	unselect: function(e){
		return this.setState('selected', false, e);
	},

	expand: function(e){
		return this.setState('expanded', true, e);
	},

	contract: function(e){
		return this.setState('expanded', false, e);
	},

	focus: function(e){
		return this.setState('focused', true, e);
	},

	blur: function(e){
		return this.setState('focused', false, e);
	}
});

NodeView.states = {
	lighted: ['light', 'unlight'],
	selected: ['select', 'unselect'],
	expanded: ['expand', 'contract'],
	focused: ['focus', 'blur'],
	hidden: ['hide', 'show'],
	actived: ['active', 'unactive']
};

var NodeListView = new Class({
	Extends: ListView,
	View: NodeView,
	tagName: 'ul',

	// allow NodeView to be considered as the view of the NodeListView element
	getAttributes: function(){
		// the goal is to prevent the element to get the View.instanceKey attributes
		return Object.clone(this.attributes);
	}
});
