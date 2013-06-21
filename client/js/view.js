/*

name: View

description: Element wrapper

note:

le truc à la angular c'est de dire j'ai une vue, un modèle
je veut que cette vue soit liée aux changements du modèle un peu comme
pour les events du HTML, j'écoute juste les events sur le modèle racine
puis je les propage à toutes les vues

en gros:

model.destroy = function(){
	// tention ceci émet deux fois destroy pour this
	this.emitter.capture('destroy');
	this.emitter.bubble('destroy');
}

rootModel.on('destroy', function(e){
	e.target; // model being destroyed

	// toutes les vues écoutant e.target doivent être détruites
});

chaque fois qu'une vue est crée elle écoute son modèle
angular se content de compiler le html de créer scope et vue correspondante
à chaque fois, ce que je fait manuellement ici

le truc c'est que moi je veux automatiser le lien entre la vue et le modèle
sauf que la vue a besoin de chose spécifique sans aucun lien avec le controlleur
si je crée un object intermédiaire (scope avec angular) qui fait ce lien et met
à jour ses propriétés en fonction d'event sur la vue et le modèle on peut automatiser
le lien vue/modèle

c'est juste le controlleur ça non?

ou alors le controlleur émet des events, et on a aussi rootControlleur qui recoit
les events de tous les controlleurs

*/

NS.View = {
	// model listeners
	listeners: {
		'destroy': 'destructor',
		'adopt': function(child, index){
			this.insertBefore(child, this.children[index]);
		},

		'emancipate': function(){
			this.parentNode.removeChild(this);
		}
	},
	// element events listeners
	events: null,
	tagName: 'div',
	className: '',
	innerHTML: '',
	attributes: null,

	constructor: function(model){
		this.controllers = {};

		this.emitter = NS.EventEmitter.new(this);
		this.listener = NS.Listener.new(null, this.listeners, this);
		this.eventListener = NS.EventListener.new(null, this.events, this);

		this.self.addInstance(this);
		this.bubble('create');

		this.setModel(model);

		this.classList = this.createClassList();
		this.attributes = this.createAttributes();
	},

	destructor: function(){
		this.bubble('destroy');
		this.unsetElement();
		this.unsetModel();
		this.self.removeInstance(this);
	},

	toString: function(){
		return '<' + this.tagName + Object.toAttrString(this.attributes) +'>' + this.innerHTML + '</' + this.tagName + '>';
	},

	createClassList: function(){
		var classList = NS.StringList.new(this.className), self = this;

		classList.update = function(){
			self.setAttribute('class', this.toString());
		};

		return classList;
	},

	createAttributes: function(){
		var attr = this.attributes ? Object.copy(this.attributes) : {};

		attr['class'] = this.classList.toString();
		attr[this.self.IDAttribute] = this.id;

		return attr;
	},

	createElement: function(){
		var element = new Element(this.tagName);

		element.setProperties(this.attributes);
		if( this.innerHTML ){
			if( this.model ){
				this.innerHTML = this.innerHTML.parse(this.model.properties);
			}
			element.innerHTML = this.innerHTML;
		}

		return element;
	},

	setElement: function(element){
		this.element = element;
		this.eventListener.emitter = element;
		this.eventListener.listen();
		this.bubble('setElement', element);
		return this;
	},

	unsetElement: function(){
		if( this.element ){
			this.removeElement();

			this.bubble('unsetElement', this.element);
			this.eventListener.stopListening();
			this.eventListener.emitter = null;
			this.element = null;
		}
		return this;
	},

	insertElement: function(into, before){
		if( !this.element ) this.render();
		into.insertBefore(this.element, before);
		this.bubble('insertElement');
		return this;
	},

	removeElement: function(){
		if( this.element ){
			this.bubble('removeElement', this.element);
			this.element.dispose();
		}
		return this;
	},

	render: function(){
		this.setElement(this.createElement());
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
			this.listener.emitter = model;
			this.listener.listen();

			this.children = this.model.children;
			if( this.ownerDocument ){
				this.ownerDocument.createChildren(this);
			}
		}
	},

	unsetModel: function(){
		if( this.model ){
			this.listener.stopListening();
			this.listener.emitter = null;
		}
	},

	hasClass: function(name){
		return this.classList.contains(name);
	},

	addClass: function(name){
		this.classList.add(name);
	},

	removeClass: function(name){
		this.classList.remove(name);
	},

	toggleClass: function(name){
		this.classList.toggle(name);
	},

	hasAttribute: function(name){
		return name in this.attributes;
	},

	setAttribute: function(name, value){
		this.attributes[name] = value;
		if( this.element ){
			this.element.setProperty(name, value);
		}
	},

	getAttribute: function(name){
		return this.attributes[name];
	}
}.supplement(
	NS.EventEmitterInterface,
	NS.childrenInterface,
	NS.treeTraversal,
	NS.treeFinder,
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

		getChildrenElement: Function.IMPLEMENT,

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

NS.viewDocument = NS.Document.new(NS.View);

Element.prototype.toView = function(){ return NS.View.self.findElementView(this); };
Event.prototype.toView = function(){ return Element.prototype.toView.call(this.target); };
CustomEvent.prototype.toView = function(){ return this.detail.view; };

Object.toAttrString = function(source){
	var html = '', key;
	for(key in source) html+= ' ' + key + '="' + source[key] + '"';
	return html;
};

NS.viewstate = {
	states: {
		lighted: ['light', 'unlight'],
		selected: ['select', 'unselect'],
		expanded: ['expand', 'contract'],
		focused: ['focus', 'blur'],
		hidden: ['hide', 'show'],
		actived: ['active', 'unactive']
	},
	toggleState: function(state, e){
		return this.bubble(this.states[state][Number(this.hasClass(state))], [e]);
	}
};

Object.eachPair(NS.viewstate.states, function(state, methods){
	var on = methods[0], off = methods[1];

	NS.viewstate[on] = function(){
		return this.bubble(on, arguments);
	};
	NS.viewstate[off] = function(e){
		return this.bubble(off, arguments);
	};
});


