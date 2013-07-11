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
		destroy: function(){
			this.destroy();
		},

		adopt: function(child, index){
			this.insertBefore(child, this.childNodes[index]);
		},

		emancipate: function(){
			this.parentNode.removeChild(this);
		}
	},

	// about element
	template: '',
	element: null,
	events: null,
	elementEmitter: null,
	elementListener: null,

	create: function(model){
		this.self.addInstance(this);

		this.controllers = {};

		this.emitter = NS.EventEmitter.new(this);
		this.modelListener = NS.EventListener.new(null, this.modelListeners, this);

		if( this.nodeName in NS.Template.cache ){
			this.template = NS.Template.cache[this.nodeName];
		}
		else{
			this.template = NS.Template.new(this.template, this.nodeName);
		}

		this.setModel(model);
		this.setElement(this.template.link(this));

		this.emit('create');
	},

	destroy: function(){
		this.emit('destroy');
		this.unsetElement();
		this.unsetModel();
		this.self.removeInstance(this);
	},

	setModel: function(model){
		if( model ){
			this.model = model;
			this.modelListener.emitter = model;
			this.modelListener.listen();

			this.childNodes = model.childNodes;
			if( this.ownerDocument ){
				this.ownerDocument.createChildNodes(this);
			}
		}
	},

	unsetModel: function(){
		if( this.model ){
			this.model = null;
			this.modelListener.stopListening();
			this.modelListener.emitter = null;
		}
	},

	getters: {},
	get: function(key){
		if( key in this.getters ){
			var getter = this.getters[key];

			if( getter.length ){
				var names = Function.argumentNames(getter), i = 0, j = names.length, name, values = [];
				for(;i<j;i++){
					name = names[i];
					// avoid infinite loop
					values[i] = name == key ? this.model.get(name) : this.get(name);
				}

				return getter.apply(this, values);
			}
			else{
				return getter.call(this);
			}
		}

		return this.model.get(key);
	},

	watch: function(key, fn, bind){
		var getters = this.getters;

		// when view.get(key) === view.model.get(key) can be false
		if( key in getters ){
			// the getter is purely virtual and don't depends on any properties
			if( getters[key].length === 0 ){
				this.model.watch(key, function(value, oldvalue){
					// restore oldvalue
					this.model.data[key] = oldvalue;
					// get the value at that moment
					oldvalue = this.get(key);
					// put back value
					this.model.data[key] = value;
					// get the value
					value = this.get(key);

					fn.call(bind, value, oldvalue);
				}, this);
			}
			// the getter depends on one or more properties
			else{
				var dependencies = Function.argumentNames(getters[key]);

				dependencies.forEach(function(dependency){
					this.model.watch(dependency, function(value, oldvalue){

						// restore oldvalue
						this.model.data[dependency] = oldvalue;
						// get the value at that moment
						oldvalue = this.get(key);
						// put back value
						this.model.data[dependency] = value;
						// get the value
						value = this.get(key);

						fn.call(bind, value, oldvalue);
					}, this);
				}, this);

			}
		}
		// when view.get(key) alwas === view.model.get(key) always true
		else{
			this.model.watch(fn, bind);
		}

		// lorsque le model recoit des données pour la première fois (initialization)
		if( this.model.hasData() ){
			fn.call(bind, this.get(key), undefined);
		}
		else{
			this.model.once('data', function(){
				fn.call(bind, this.get(key), undefined);
			}.bind(this));
		}
	},

	setElement: function(element){
		this.element = element;

		this.elementEmitter = NS.ElementEmitter.new(this.element, this);
		this.elementListener = NS.EventListener.new(this.elementEmitter, this.events, this);
		this.elementListener.listen();

		this.setAttribute('data-view', this.id);

		return this;
	},

	unsetElement: function(){
		if( this.element ){
			this.removeElement();

			this.elementEmitter = null;
			this.elementListener.stopListening();
			this.elementListener = null;
			this.element = null;
		}

		return this;
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
			this.element.parentNode.removeChild(this.element);
		}

		return this;
	},

	cast: function(item){
		if( item != null && typeof item.toView == 'function' ) return item.toView();
		return null;
	},

	toView: Function.THIS,

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
	NS.NodeFinder
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

Element.prototype.toView = function(){ return NS.View.self.findElementView(this); };
Event.prototype.toView = function(){ return Element.prototype.toView.call(this.target); };
CustomEvent.prototype.toView = function(){ return this.detail.view; };

NS.viewDocument = NS.Document.new();
NS.viewDocument.oninsert = function(node, child){
	var childrenElement = node.getChildrenElement();
	// si cette vue possède l'élément qui contient les enfants on insère l'enfant
	if( childrenElement ){
		child.insertElement(
			childrenElement,
			child.nextSibling ? child.nextSibling.element : null
		);
	}
};
NS.viewDocument.onremove = function(node, child){
	child.removeElement();
};
