/*global ListenerHandler, EventHandler*/

// view of model & collection
var View = new Class({
	tagName: 'div',
	attributes: {},
	listeners: {},
	events: {},

	initialize: function(model){
		this.model = model;
		this.DOMID = View.instanceValue++;
		View.instances[this.DOMID] = this;

		// ListenerHandler will take care to bind this.model, this.listeners and this as context
		this.modelEvents = new ListenerHandler(this.model, this.listeners, this);
		// EventHandler will take care to bind this.element, this.events and this as context
		this.elementEvents = new EventHandler(null, this.events, this);
	},

	createEvent: function(name){
		var event = new CustomEvent('view:' + name, {
			bubbles: true,
			cancelable: true,
			detail: {
				name: name,
				args: arguments,
				view: this
			}
		});

		return event;
	},

	// NodeView émet des évènements via le DOM de l'élément de la vue
	dispatchEvent: function(e){
		this.element.dispatchEvent(e);
		return this;
	},

	emit: function(name){
		return this.dispatchEvent(this.createEvent.apply(this, arguments));
	},

	getAttributes: function(){
		var attr = Object.clone(this.attributes);

		attr[View.instanceKey] = this.DOMID;

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
		this.elementEvents.enableAll();
		this.modelEvents.enableAll();
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
		this.dispose();

		if( this.element ){
			delete View.instances[this.DOMID];
			this.elementEvents.disableAll();
			this.modelEvents.disableAll();
			this.element.destroy();
		}
	}
});


// View.toInstance is automatically called when View() without new, his purpose is to convert the argument into an instance of the Class
View.toInstance = function(item){
	if( item != null && typeof item.toView == 'function' ) return item.toView();
	return null;
};

View.instanceKey = 'data-view';
View.instanceValue = 0;
View.instances = {};
// retourne le noeud qui détient element ou null
Element.prototype.toView = function(){
	var element = this, instanceValue;

	while( element ){
		if( element.getAttribute ){
			instanceValue = element.getAttribute(View.instanceKey);
			if( instanceValue != null ) return View.instances[instanceValue];
		}
		element = element.parentNode;
	}

	return null;
};
Event.prototype.toView = function(){ return Element.prototype.toView.call(this.target); };
CustomEvent.prototype.toView = function(){ return this.detail.view; };
View.prototype.toView = Function.THIS;

var ListView = new Class({
	Extends: View,
	View: View,

	initialize: function(collection){
		View.prototype.initialize.call(this, collection);
	},

	createView: function(model){
		return new this.View(model);
	},

	add: function(view, index){
		view.append(this.element, index ? this.element.children[index] : null);
	},

	createList: function(){
		this.model.forEach(function(model){
			this.add(this.createView(model));
		}, this);
	}
});
