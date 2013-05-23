/*global Emitter, ListenerHandler, EventHandler*/

var viewDocument = Object.append(new Emitter(), {
	views: [],
	viewAttribute: 'data-view',
	lastID: 0,

	handleEmit: function(view, name, args){
		this.emit(name, view, args);

		if( view.element ){
			var event = this.createEvent(view, name, args);
			// View émet des évènements via son élément
			view.element.dispatchEvent(event);
		}
	},

	createEvent: function(view, name, args){
		var event = new CustomEvent('view:' + name, {
			bubbles: true,
			cancelable: true,
			detail: {
				view: view,
				name: name,
				args: args
			}
		});

		return event;
	},

	isElementView: function(element){
		return element.hasAttribute && element.hasAttribute(this.viewAttribute);
	},

	getElementView: function(element){
		var view = null;

		if( this.isElementView(element) ){
			view = this.views[element.getAttribute(this.viewAttribute)];
		}

		return view;
	},

	findElementView: function(element){
		var view = null;

		while( element ){
			view = this.getElementView(element);
			if( view ) break;
			element = element.parentNode;
		}

		return view;
	}
});

viewDocument.on({
	'create': function(view){
		this.views[view.DOMID = this.lastID++] = view;
	},

	'destroy': function(view){
		delete this.views[view.DOMID];
	}
});

// view of model & collection
var View = new Class({
	tagName: 'div',
	attributes: {},
	listeners: {},
	events: {},

	initialize: function(model){
		this.model = model;

		// ListenerHandler will take care to bind this.model, this.listeners and this as context
		this.modelEvents = new ListenerHandler(this.model, this.listeners, this);
		// EventHandler will take care to bind this.element, this.events and this as context
		this.elementEvents = new EventHandler(null, this.events, this);

		this.emit('create');
	},

	emit: function(name){
		viewDocument.handleEmit(this, name, arguments);
		return this;
	},

	getAttributes: function(){
		var attr = Object.clone(this.attributes);

		attr[viewDocument.viewAttribute] = this.DOMID;

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
		this.elementEvents.emitter = this.element;
		this.elementEvents.listen();
		this.modelEvents.listen();
		return this;
	},

	render: function(){
		this.setElement(this.createElement());
		return this;
	},

	append: function(element, before){
		if( !this.element ) this.render();
		element.insertBefore(this.element, before);
		this.emit('append');
		return this;
	},

	dispose: function(){
		if( this.element ){
			this.emit('dispose');
			this.element.dispose();
		}
	},

	destroy: function(){
		this.emit('destroy');

		if( this.element ){
			this.dispose();
			this.elementEvents.stopListening();
			this.element.destroy();
		}

		this.modelEvents.stopListening();
	}
});

// View.toInstance is automatically called when View() without new, his purpose is to convert the argument into an instance of the Class
View.toInstance = function(item){
	if( item != null && typeof item.toView == 'function' ) return item.toView();
	return null;
};

// retourne le noeud qui détient element ou null
Element.prototype.toView = function(){ return viewDocument.findElementView(this); };
Event.prototype.toView = function(){ return Element.prototype.toView.call(this.target); };
CustomEvent.prototype.toView = function(){ return this.detail.view; };
View.prototype.toView = Function.THIS;


Object.defineProperty(View.prototype, 'parentView', {
	get: function(){
		return View(this.element.parentNode.parentNode);
	}
});

Object.defineProperty(View.prototype, 'parentNode', {
	get: function(){ return this.parentView; }
});

// listview should be an instanceof Array, or at least implement the Array behaviour
// that way i could write return View(this.element.getChild('ul')) || []; for get children

Object.defineProperty(View.prototype, 'children', {
	get: function(){
		return View(this.element.parentNode.parentNode);
	}
});

var ListView = new Class({
	Extends: Array,
	View: View,

	createView: function(model){
		return new this.View(model);
	},

	add: function(view, index){
		this.splice(index, 0, view);
		view.append(this.element, index ? this.element.children[index] : null);
	},

	createList: function(){
		this.model.forEach(function(model){
			this.add(this.createView(model));
		}, this);
	}
});

ListView.implement(View.prototype);

ListView.prototype.initialize = function(collection){
	View.prototype.initialize.call(this, collection);
	//this.push.apply(this, collection);
};
