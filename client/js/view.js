/* global */

NS.View = NS.Item.extend(NS.Emitter, {
	modelEvents: {
		'destroy': 'destroy'
	},
	tagName: 'div',
	className: '',
	attributes: null,

	constructor: function(model){
		// we have to set it manually because this can be called with an other context
		// that's why NS doesn't provide help as this.class or this.super
		this.constructor = NS.View.constructor;

		this.constructor.instances[this.id = this.constructor.lastID++] = this;

		// Listener call this.handlers over this.model events with this as context
		this.modelListener = NS.Listener.new(null, this.modelEvents, this);

		this.emit('create');

		this.setModel(model);
	},

	destroy: function(){
		this.emit('destroy');
		this.unsetElement();
		this.unsetModel();
		delete this.constructor.instances[this.id];
	},

	cast: function(item){
		if( item != null && typeof item.toView == 'function' ) return item.toView();
		return null;
	},

	toView: Function.THIS,

	setModel: function(model){
		if( model ){
			this.model = model;
			this.modelListener.emitter = model;
			this.modelListener.listen();
		}
	},

	unsetModel: function(){
		if( this.model ){
			this.modelListener.stopListening();
			delete this.modelListener.emitter;
		}
	},

	getClassName: function(){
		return NS.StringList.new(this.className);
	},

	getAttributes: function(){
		var attr = this.attributes ? Object.copy(this.attributes) : {};

		attr['class'] = this.getClassName();
		attr[this.constructor.IDAttribute] = this.id;

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

Object.append(NS.View.constructor, {
	instances: {},
	IDAttribute: 'data-view',
	lastID: 0,

	isElementView: function(element){
		return element.hasAttribute && element.hasAttribute(this.IDAttribute);
	},

	getElementView: function(element){
		var view = null;

		if( this.isElementView(element) ){
			view = this.instances[element.getAttribute(this.IDAttribute)];
		}

		return view;
	},

	// retourne le noeud qui détient element ou null
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

Element.prototype.toView = function(){ return NS.View.constructor.findElementView(this); };
Event.prototype.toView = function(){ return Element.prototype.toView.call(this.target); };
CustomEvent.prototype.toView = function(){ return this.detail.view; };

// View émet des évènements via le DOM de son élément
NS.View.on('*', function(name, args){
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

NS.viewstate = {
	states: {
		lighted: ['light', 'unlight'],
		selected: ['select', 'unselect'],
		expanded: ['expand', 'contract'],
		focused: ['focus', 'blur'],
		hidden: ['hide', 'show'],
		actived: ['active', 'unactive']
	}
};

Object.eachPair(NS.viewstate.states, function(state, methods){
	var on = methods[0], off = methods[1];

	NS.viewstate[on] = function(e){
		return this.addClass(state, e);
	};
	NS.viewstate[off] = function(e){
		return this.removeClass(state, e);
	};
});


