/* global View, TreeStructure, TreeTraversal, TreeFinder, StringList */

View.define('node', {
	Implements: [TreeStructure, TreeTraversal, TreeFinder],
	tagName: 'li',
	className: 'node',
	modelEvents: {
		'adopt': function(child, index){
			this.insertBefore(child, this.children[index]);
		},

		'emancipate': function(){
			this.parentNode.removeChild(this);
		},

		'change:name': function(name){
			this.updateName(name);
		}
	},

	constructor: function(model){
		this.initChildren();
		View.prototype.constructor.call(this, model);
	},

	setModel: function(model){
		View.prototype.setModel.call(this, model);
		if( model && model.children ){
			this.setChildren(model.children);
		}
	},

	oninsertchild: function(child){
		var childrenElement = this.getChildrenElement();
		// si cette vue possède l'élément qui contient les enfants on insère l'enfant
		if( childrenElement ){
			child.insertElement(childrenElement, child.getNextSibling(), true);
		}
	},

	onremovechild: function(child){
		child.removeElement();
	},

	getChildrenElement: function(){
		return this.childrenElement;
	},

	setChildrenElement: function(element){
		this.childrenElement = element;
	},

	createChildrenElement: function(element){
		return new Element('ul');
	},

	insertChildren: function(element){
		this.setChildrenElement(element);
		this.children.forEach(function(child){ child.insertElement(element); });
	},

	renderChildren: function(){
		var childrenElement = this.createChildrenElement();
		this.element.appendChild(childrenElement);
		this.insertChildren(childrenElement);
	},

	// NOTE: will be override by FileNodeView -> should not be considered empty until loaded
	isEmpty: function(){
		return this.children.length === 0;
	},

	getClassName: function(){
		var className = View.prototype.getClassName.call(this);

		if( this.isEmpty() ) className.add('empty');

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
		switch(what){
		case 'li':
			return this.element;
		case 'ul':
		case 'div':
			return this.getDom('li').getChild(what);
		case 'name':
			return this.getDom('div').getChild('span');
		default:
			return this.getDom('div').getChild(what);
		}
	},

	updateName: function(name){
		this.getDom('name').innerHTML = name;
	},

	hasState: function(state){
		return this.hasClass(state);
	},

	setState: function(state, value, e){
		if( this.hasState(state) == value ) return false;

		if( state == 'expanded' ){
			if( this.isEmpty() ) return false;
			if( !this.getChildrenElement() ) this.renderChildren();
		}

		this.toggleClass(state, value);
		this.emit(View.states[state][value ? 0 : 1], e);
		return true;
	},

	toggleState: function(state, e){
		return this.setState(state, !this.hasState(state), e);
	},

	eachState: function(fn, bind){
		Object.eachPair(View.states, function(state){
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
	}
});

View.states = {
	lighted: ['light', 'unlight'],
	selected: ['select', 'unselect'],
	expanded: ['expand', 'contract'],
	focused: ['focus', 'blur'],
	hidden: ['hide', 'show'],
	actived: ['active', 'unactive']
};
