/* global Emitter, ListenerHandler, StringList */

var View = new Class({
	Implements: Emitter,
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

	addClass: function(name){
		if( this.element ){
			this.element.addClass(name);
		}
	},

	removeClass: function(name){
		if( this.element ){
			this.element.removeClass(name);
		}
	},

	toggleClass: function(name, value){
		if( this.element ){
			this.element.toggleClass(name, value);
		}
	}
});

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
