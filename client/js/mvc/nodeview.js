/* global View, TreeStructure, TreeTraversal, TreeFinder, StringList */

var NodeView = new Class({
	Extends: View,
	Implements: [TreeStructure, TreeTraversal, TreeFinder],
	tagName: 'li',
	modelEvents: {
		//'change:name': NodeView.prototype.updateName
	},
	attributes: {
		//'data-lightable': true
		'class': 'node'
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

	insertBefore: function(child, sibling){
		child = TreeStructure.insertBefore.call(this, child, sibling);

		var childrenElement = this.getChildrenElement();
		// si cette vue possède un élément, on insère visuellement l'enfant
		if( childrenElement ){
			child.insertElement(childrenElement, sibling ? sibling.element : null);
		}

		return child;
	},

	appendChild: function(child){
		child = TreeStructure.appendChild.call(this, child);

		var childrenElement = this.getChildrenElement();
		// si cette vue possède un élément, on insère visuellement l'enfant
		if( childrenElement ){
			child.insertElement(childrenElement);
		}

		return child;
	},

	toString: function(){
		return this.model.get('name');
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

	adopt: function(child, index){
		this.insertBefore(child, index ? this.children[index] : null);
	},

	// NOTE: will be override by FileNodeView -> should not be considered empty until loaded
	isEmpty: function(){
		return this.children.length === 0;
	},

	getLevel: function(){
		var level = 0, parent = this.parentNode;
		while(parent){
			level++;
			parent = parent.parentNode;
		}
		return level;
	},

	getAttributes: function(){
		var attr = View.prototype.getAttributes.call(this), className = new StringList(attr['class']);

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

	getHTML: function(){
		if( !this.model ) console.trace();
		return '<div><ins class="tool"></ins><name>' + this.model.name + '</name></div>';
	},

	getDom: function(what){
		switch(what){
		case 'li':
			return this.element;
		case 'ul':
		case 'div':
			return this.getDom('li').getChild(what);
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
		this.toggleClass(state, value);
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
		if( this.isEmpty() ) return false;
		if( !this.childrenElement ) this.renderChildren();
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

NodeView.states = {
	lighted: ['light', 'unlight'],
	selected: ['select', 'unselect'],
	expanded: ['expand', 'contract'],
	focused: ['focus', 'blur'],
	hidden: ['hide', 'show'],
	actived: ['active', 'unactive']
};
