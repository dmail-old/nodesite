/* global viewDocument, ListenerHandler, EventHandler */

var View = new Class({
	tagName: 'div',
	attributes: {},
	listeners: {},
	// events: {},

	initialize: function(model){
		// ListenerHandler will take care to bind this.model, this.listeners and this as context
		this.modelEvents = new ListenerHandler(null, this.listeners, this);
		// EventHandler will take care to bind this.element, this.events and this as context
		// this.elementEvents = new EventHandler(null, this.events, this);

		this.setModel(model);

		this.emit('create');
	},

	toString: function(){
		return 'View';
	},

	setModel: function(model){
		this.model = model;
		this.modelEvents.emitter = model;
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
		//this.elementEvents.emitter = this.element;
		//this.elementEvents.listen();
		this.modelEvents.listen();
		this.emit('setElement', element);
		return this;
	},

	unsetElement: function(){
		if( this.element ){
			this.removeElement();

			this.emit('unsetElement', this.element);

			this.element.destroy();
			delete this.element;
			//this.elementEvents.stopListening();
		}
	},

	render: function(){
		this.setElement(this.createElement());
		return this;
	},

	insertElement: function(into, before){
		if( !this.element ) this.render();
		into.insertBefore(this.element, before);
		this.emit('insertElement');
		return this;
	},

	removeElement: function(){
		if( this.element ){
			this.emit('removeElement');
			this.element.dispose();
		}
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
	},

	destroy: function(){
		this.emit('destroy');
		this.unsetElement();
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
