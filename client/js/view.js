/*

name: View

description: Element wrapper

*/

NS.View = {
	// about view
	id: null,
	emitter: null,
	controllers: null,

	// about model
	model: null,
	modelListener: null,
	modelListeners: {
		destroy: 'destroy',

		change: function(e){
			var property = e.args[0], value = e.args[1];
			this.emit('change:' + property, value);
		},

		adopt: function(e){
			var child = e.args[0], index = e.args[1];

			this.insertBefore(child, this.childNodes[index]);
		},

		emancipate: function(){
			this.parentNode.removeChild(this);
		}
	},

	// about element
	element: null,
	events: null,
	elementEmitter: null,
	elementListener: null,

	tagName: 'div',
	innerHTML: '',
	attributes: null,
	className: '',
	style: null,

	updaters: {
		content: function(value){
			this.nodeValue = value;
		}
	},

	create: function(model){
		this.self.addInstance(this);

		this.controllers = {};

		this.emitter = NS.EventEmitter.new(this);
		this.modelListener = NS.EventListener.new(null, this.modelListeners, this);

		this.setModel(model);
		this.createElement();

		this.emit('create');
	},

	destroy: function(){
		this.emit('destroy');
		this.destroyElement();
		this.unsetModel();
		this.self.removeInstance(this);
	},

	createElement: function(){
		var element = document.createElement(this.tagName), key;

		this.element = element;
		this.elementEmitter = NS.ElementEmitter.new(element, this);
		this.elementListener = NS.EventListener.new(this.elementEmitter, this.events, this);
		this.elementListener.listen();

		if( this.attributes ){
			for(key in this.attributes){
				this.setAttribute(key, this.attributes[key]);
			}
		}
		this.setAttribute(this.self.IDAttribute, this.id);
		if( this.className ){
			this.element.className = this.className;
		}

		if( this.style ){
			for(key in this.style){
				this.setStyle(key, this.style[key]);
			}
		}

		if( this.innerHTML ){
			this.element.innerHTML = this.innerHTML;
		}

		this.emit('createElement');

		this.parseElement(element);

		return this;
	},

	destroyElement: function(){
		if( this.element ){
			this.removeElement();

			this.emit('destroyElement');

			this.elementEmitter = null;
			this.elementListener.stopListening();
			this.elementListener = null;
			this.element = null;
		}

		return this;
	},

	watch: function(property, fn, bind){
		if( property in this.model.getters ){
			Function.argumentNames(this.getters[property]).forEach(function(property){
				this.on('change:' + property, function(){
					fn.call(bind, this.model.get(property));
				});
			});
		}
		else{
			this.on('change:' + property, fn.bind(bind));
		}
	},

	parseNode: function(node){
		var list = [];

		switch( node.nodeType ){
		case 1: /* Element */
			var attributes = node.attributes, i = 0, j = attributes.length, attr;
			for(;i<j;i++){
				attr = attributes[i];
			}

			// use class as directive
			var className = node.className;
			if( typeof className == 'string' && className !== '' ){

			}

			break;
		case 3: /* Text Node */
			var value = node.nodeValue;

			if( value.startsWith('{') ){
				var property = value.substring(1, value.length - 1);

				this.updaters.content.call(node, this.model.get(property));
				this.watch(property, this.updaters.content, node);
			}
			break;
		case 8: /* Comment */
			//this.element.nodeValue;
			break;
		}
	},

	parseElement: function(element){
		element.getFirst(this.parseNode, this);
	},

	insertElement: function(into, before){

		this.removeElement();
		into.insertBefore(this.element, before);
		this.emit('insertElement');

		return this;
	},

	removeElement: function(){
		if( this.element.parentNode ){
			this.emit('removeElement');
			this.element.dispose();
		}

		return this;
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

			this.childNodes = this.model.childNodes;
			if( this.ownerDocument ){
				this.ownerDocument.createChildNodes(this);
			}
		}
	},

	unsetModel: function(){
		if( this.model ){
			this.modelListener.stopListening();
			this.modelListener.emitter = null;
		}
	},

	hasClass: function(name){
		return this.element.classList.contains(name);
	},

	addClass: function(name){
		this.element.classList.add(name);
		return this;
	},

	removeClass: function(name){
		this.element.classList.remove(name);
	},

	toggleClass: function(name, force){
		this.element.classList.toggle(name, force);
	},

	hasAttribute: function(name){
		return this.element.hasAttribute(name);
	},

	setAttribute: function(name, value){
		this.element.setProperty(name, value);
	},

	getAttribute: function(name){
		return this.element.getAttribute(name);
	},

	setStyle: function(name, value){
		this.element.setStyle(name, value);
	},

	getStyle: function(name){
		return this.element.getStyle(name);
	}
}.supplement(
	NS.EventEmitterInterface,
	NS.NodeInterface,
	NS.NodeFinder,
	{
		oninsertchild: function(child){
			var childrenElement = this.getChildrenElement();
			// si cette vue possède l'élément qui contient les enfants on insère l'enfant
			if( childrenElement ){
				child.insertElement(
					childrenElement,
					child.nextSibling ? child.nextSibling.element : null
				);
			}
		},

		onremovechild: function(child){
			child.removeElement();
		},

		getChildrenElement: Function.IMPLEMENT
	}
);

NS.View.self =  {
	instances: {},
	IDAttribute: 'data-view',
	lastID: 0,

	nextId: function(){
		return this.lastID++;
	},

	addInstance: function(view){
		view.id = this.nextId();
		this.instances[view.id] = view;
	},

	removeInstance: function(view){
		delete this.instances[view.id];
	},

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

	// retourne la vue qui liée à element ou null si l'élément ne correspond à aucune vue
	findElementView: function(element){
		var view = null;

		while( element ){
			view = this.getElementView(element);
			if( view ) break;
			element = element.parentNode;
		}

		return view;
	}
};

// show a blank image, useful to have a default src attribute
Image.EMPTY = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

Element.prototype.toView = function(){ return NS.View.self.findElementView(this); };
Event.prototype.toView = function(){ return Element.prototype.toView.call(this.target); };
CustomEvent.prototype.toView = function(){ return this.detail.view; };

NS.viewDocument = NS.Document.new();
