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

ou alors le controlleur émat des events, et on a aussi rootControlleur qui recoit
les events de tous les controlleurs

*/

NS.View = {
	// model listeners
	listeners: {
		'destroy': 'destroy'
	},
	tagName: 'div',
	className: '',
	innerHTML: '',
	attributes: null,

	constructor: function(model){
		this.emitter = NS.Emitter.new(this);
		// Listener call this.listeners over this.model events with this as context
		this.listener = NS.Listener.new(null, this.listeners, this);

		this.self.instances[this.id = this.self.lastID++] = this;

		// View émet des évènements via le DOM de son élément
		this.on('*', function(name, args){
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

		this.emit('create');
		this.setModel(model);

		this.classList = this.createClassList();
		this.attributes = this.createAttributes();
	},

	destroy: function(){
		this.emit('destroy');
		this.unsetElement();
		this.unsetModel();
		delete this.self.instances[this.id];
	},

	toString: function(){
		return '<' + this.tagName + Object.toAttrString(this.attributes) +'>' + this.innerHTML + '</' + this.tagName + '>';
	},

	createClassList: function(){
		return NS.StringList.new(this.className);
	},

	createAttributes: function(){
		var attr = this.attributes ? Object.copy(this.attributes) : {};

		attr['class'] = this.classList.toString();
		attr[this.self.IDAttribute] = this.id;

		return attr;
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
		}
	},

	unsetModel: function(){
		if( this.model ){
			this.listener.stopListening();
			this.listener.emitter = null;
		}
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
};

Object.append(NS.View, NS.EmitterInterface);

NS.View.self =  {
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


