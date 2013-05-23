/* global StringList, View, ListView */

var NodeView = new Class({
	Extends: View,
	tagName: 'li',
	listeners: {
		//'change:name': NodeView.prototype.updateName
	},
	attributes: {
		//'data-lightable': true
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
		return '<div><tool></tool><name>' + this.model.name + '</name></div>';
	},

	getDom: function(what){
		switch(what){
		case 'li':
			return this.element;
		case 'ul':
			return this.childrenView ? this.childrenView.element : null;
		case 'div':
			return this.element.getChild(what);
		default:
			return this.getDom('div').getChild(what);
		}
	},

	updateName: function(name){
		this.getDom('name').innerHTML = name;
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
		if( !this.childrenView ) this.createChildrenView();
		return this.setState('expanded', true, e);
	},

	contract: function(e){
		return this.setState('expanded', false, e);
	},

	focus: function(e){
		//this.scrollTo();
		return this.setState('focused', true, e);
	},

	blur: function(e){
		return this.setState('focused', false, e);
	},

	hide: function(e){
		return this.setState('hidden', true, e);
	},

	show: function(e){
		return this.setState('hidden', false, e);
	},

	isVisible: function(element){
		return !element.hasClass('hidden');
	},

	getParentView: function(){
		return View(this.element.parentNode.parentNode);
	},

	// même chose avec prev
	// même chose ou on fait next puis prev
	// pour pagedown et pageup à voir
	// pour home et end on crée getfirstvisible getlastvisible
	// faudras qu'on puisse recup nextvisible et prev y compris en repartant du début (loop)
	getNextVisible: function(match){
		var visible = this.element.getNext(this.isVisible);

		if( visible ) return visible;

		var parent = this.getParentView();

		return parent ? parent.getNextVisible() : null;
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
