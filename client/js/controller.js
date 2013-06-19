/*

les controlleurs seront créé globalement
ils s'appliqueront à toutes les vues indiquant qu'elles utilisent ce contrôleur
leurs events (dom) sont ajouter à window
un rootControlleur recoit les events de tous les controlleurs

*/

NS.Controller = {
	providers: {},
	requires: null,

	// view listeners
	listeners: {
		'setElement': function(element){
			this.setElement(element);
		},

		'unsetElement': function(){
			this.unsetElement();
		},

		'destroy': function(){
			this.destroy();
		}
	},
	modelListeners: null,
	// view element event listeners
	events: null,

	constructor: function(view){
		// listen to view events
		this.listener = NS.Listener.new(null, this.listeners, this);
		// listen to view element events
		this.eventListener = NS.EventListener.new(null, this.events, this);

		this.emitter = NS.Emitter.new(this);

		this.setView(view);
		this.resolveDependency();
	},

	resolveDependency: function(){
		var requires = this.requires;
		if( requires ){
			if( typeof requires == 'string' ) requires = [requires];
			requires.forEach(this.provide, this);
		}
	},

	provide: function(name){
		var provider, instance;

		if( name in this.view.controllers ){
			instance = this.view.controllers[name];
		}
		else{
			provider = this.providers[name];

			if( provider ){
				instance = provider.call(this, this.view);
			}
			else{
				if( !(name in NS) ) console.error(name);
				instance = NS[name].new(this.view);
			}
		}

		this[name] = instance;
	},

	setView: function(view){
		if( view ){
			this.view = view;

			if( !this.view.controllers ) this.view.controllers = {};
			this.view.controllers[this.name] = this;

			this.listener.emitter = view;
			this.listener.listen();

			if( this.view.element ) this.setElement(this.view.element);
		}
	},

	unsetView: function(){
		if( this.view ){
			if( this.view.element && this.element == this.view.element ) this.unsetElement();

			this.listener.stopListening();
			this.listener.emitter = null;

			delete this.view.controllers[this.name];

			delete this.view;
		}
	},

	setElement: function(element){
		if( element ){
			this.eventListener.emitter = element;
			this.eventListener.listen();
		}
	},

	unsetElement: function(){
		if( this.element ){
			this.eventListener.stopListening();
			this.eventListener.emitter = null;
		}
	},

	destroy: function(){
		this.unsetView();
		this.unsetElement();
	}
};

Object.append(NS.Controller, NS.EmitterInterface);
