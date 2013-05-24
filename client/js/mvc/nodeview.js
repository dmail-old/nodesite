/* global View, TreeTraversal, TreeFinder, StringList, TreeExplorer */

var NodeView = new Class({
	Extends: View,
	Implements: [TreeTraversal, TreeFinder],
	tagName: 'li',
	listeners: {
		//'change:name': NodeView.prototype.updateName
	},
	attributes: {
		//'data-lightable': true
	},

	initialize: function(){
		View.prototype.initialize.apply(this, arguments);
		this.children = [];
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
		if( !this.getDom('ul') ){
			this.createChildren();
		}
		else{
			view.append(this.getDom('ul'), index ? this.children[index].element : null);
			this.children.splice(index, 0, view);
		}
	},

	appendChild: function(model, index){
		var view = this.create(model);
		this.children[index] = view;
		view.parentNode = this;
		view.append(this.getDom('ul'));

		return view;
	},

	createChildren: function(element){
		// IMPORTANT: conserver cet ordre pour que les events des li dans createList remontent bien le DOM par le ul et son parent
		var ul = new Element('ul');
		this.element.appendChild(ul);
		this.model.children.forEach(this.appendChild, this);
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
		if( !this.getDom('ul') ) this.createChildren();
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

	getLevel: function(){
		var level = 0, parent = this.parentNode;
		while(parent){
			level++;
			parent = parent.parentNode;
		}
		return level;
	},

	// même chose avec prev
	// même chose ou on fait next puis prev
	// pour pagedown et pageup à voir
	// pour home et end on crée getfirstvisible getlastvisible
	// faudras qu'on puisse recup nextvisible et prev y compris en repartant du début (loop)
	getNextVisible: function(match){
		var visible = this.element.getNext(this.isVisible);

		if( visible ) return visible;

		var parent = this.parentNode;

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

NodeView.implement(TreeExplorer);
NodeView.prototype.acceptDescendant = function(view){
	return view.hasState('expanded') && !view.hasState('hidden');
};
