/* global
	MVC, Emitter, ListenerHandler, StringList,
	TreeStructure, TreeTraversal, TreeFinder
*/

var View = new Class({
	modelEvents: {
		'destroy': 'destroy'
	},
	tagName: 'div',
	className: '',
	attributes: null,

	constructor: function View(model){
		// called without new
		if( !(this instanceof View) ){
			if( model != null && typeof model.toView == 'function' ) return model.toView();
			return null;
		}

		View.instances[this.id = View.lastID++] = this;

		// ListenerHandler call this.handlers over this.model events with this as context
		this.modelEventsHandler = new ListenerHandler(null, this.modelEvents, this);

		this.emit('create');

		this.setModel(model);
	},

	destroy: function(){
		this.emit('destroy');
		this.unsetElement();
		this.unsetModel();
		delete View.instances[this.id];
	},

	setModel: function(model){
		if( model ){
			this.model = model;
			this.modelEventsHandler.emitter = model;
			this.modelEventsHandler.listen();
		}
	},

	unsetModel: function(){
		if( this.model ){
			this.modelEventsHandler.stopListening();
			delete this.modelEventsHandler.emitter;
		}
	},

	getClassName: function(){
		return new StringList(this.className);
	},

	getAttributes: function(){
		var attr = this.attributes ? Object.copy(this.attributes) : {};

		attr['class'] = this.getClassName();
		attr[View.IDAttribute] = this.id;

		return attr;
	},

	getHTML: function(){
		return '';
	},

	/*
	toString: function(){
		return '<' + this.tagName + Object.toAttrString(this.getAttributes()) +'>' + this.getHTML() + '</' + this.tagName + '>';
	},
	*/

	createElement: function(){
		var element = new Element(this.tagName), html = this.getHTML();

		element.setProperties(this.getAttributes());
		if( html ) element.innerHTML = html;

		return element;
	},

	setElement: function(element){
		this.element = element;
		this.emit('setElement', element);
		return this;
	},

	unsetElement: function(){
		if( this.element ){
			this.removeElement();
			this.emit('unsetElement', this.element);
			this.element.destroy();
			delete this.element;
		}
		return this;
	},

	insertElement: function(into, before, test){
		if( !this.element ) this.render();
		into.insertBefore(this.element, before);
		this.emit('insertElement');
		return this;
	},

	removeElement: function(){
		if( this.element ){
			this.emit('removeElement', this.element);
			this.element.dispose();
		}
		return this;
	},

	render: function(){
		this.setElement(this.createElement());
		return this;
	},

	hasClass: function(name){
		return this.element && this.element.hasClass(name);
	},

	addClass: function(name, e){
		if( this.element && !this.hasClass(name) ){
			this.element.addClass(name);
			this.emit('addclass:' + name, e);
		}
	},

	removeClass: function(name, e){
		if( this.element && this.hasClass(name) ){
			this.element.removeClass(name);
			this.emit('removeclass:' + name, e);
		}
	},

	toggleClass: function(name, e){
		if( this.element ){
			if( this.hasClass(name) ){
				this.removeClass(name, e);
			}
			else{
				this.addClass(name, e);
			}
		}
	}
});

View.implement(Emitter);
Object.merge(View, Class.manager);

View.instances = {};
View.IDAttribute = 'data-view';
View.lastID = 0;

View.isElementView = function(element){
	return element.hasAttribute && element.hasAttribute(this.IDAttribute);
};

View.getElementView = function(element){
	var view = null;

	if( this.isElementView(element) ){
		view = this.instances[element.getAttribute(this.IDAttribute)];
	}

	return view;
};

View.findElementView = function(element){
	var view = null;

	while( element ){
		view = this.getElementView(element);
		if( view ) break;
		element = element.parentNode;
	}

	return view;
};

// retourne le noeud qui détient element ou null
Element.prototype.toView = function(){ return View.findElementView(this); };
Event.prototype.toView = function(){ return Element.prototype.toView.call(this.target); };
CustomEvent.prototype.toView = function(){ return this.detail.view; };
View.prototype.toView = Function.THIS;

// View émet des évènements via le DOM de son élément
View.prototype.on('*', function(name, args){
	if( this.element ){
		var event = new CustomEvent('view:' + name, {
			bubbles: true,
			cancelable: true,
			detail: {
				view: this,
				name: name,
				args: args
			}
		});
		this.element.dispatchEvent(event);
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

View.State = {};
Object.eachPair(View.states, function(state, methods){
	var on = methods[0], off = methods[1];

	View.State[on] = function(e){
		return this.addClass(state, e);
	};
	View.State[off] = function(e){
		return this.removeClass(state, e);
	};
});

var TreeEmitter = new Class({
	Implements: Emitter,

	constructor: function(bind){
		this.bind = bind || this;
	},

	applyListener: function(listener, name, args){
		if( typeof listener == 'object' ) return this.applyHandler(listener, name, args);
		else return listener.apply(this.bind, args);
	},

	applyListeners: function(name, args){
		if( name == 'test' ) console.log(this.bind, this.bind.parentNode);

		if( this.bind.parentNode ){
			this.bind.parentNode.treeEmitter.applyListeners(name, args);
		}

		return Emitter.applyListeners.call(this, name, args);
	}
});

View.Node = {};

Object.merge(View.Node, TreeStructure, TreeTraversal, TreeFinder);

Object.append(View.Node, {
	modelEvents: {
		'adopt': function(child, index){
			this.insertBefore(child, this.children[index]);
		},

		'emancipate': function(){
			this.parentNode.removeChild(this);
		},
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
	}
});


