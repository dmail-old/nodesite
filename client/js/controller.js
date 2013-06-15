/* global */

NS.Controller = Object.prototype.extend({
	viewEvents: {
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
	events: null,
	requires: null,

	constructor: function(view){
		this.viewListener = require('lib/listener').new(null, this.viewEvents, this);
		this.elementListener = require('browser/eventListener').new(null, this.events, this);
		this.elementListener.callHandler = this.callHandler;

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
			provider = NS.Controller.providers[name];

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

	callHandler: require('browser/eventListener').callHandler,

	setView: function(view){
		if( view ){
			this.view = view;

			this.view.controllers[this.name] = this;

			this.viewListener.emitter = view;
			this.viewListener.listen();

			if( this.view.element ) this.setElement(this.view.element);
		}
	},

	unsetView: function(){
		if( this.view ){
			if( this.view.element && this.element == this.view.element ) this.unsetElement();

			this.viewListener.stopListening();
			delete this.viewListener.emitter;

			delete this.view.controllers[this.name];

			delete this.view;
		}
	},

	setElement: function(element){
		if( element ){
			this.elementListener.emitter = element;
			this.elementListener.listen();
		}
	},

	unsetElement: function(){
		if( this.element ){
			this.elementListener.stopListening();
			delete this.elementListener.emitter;
		}
	},

	destroy: function(){
		this.unsetView();
		this.unsetElement();
	}
});

NS.Controller.providers = {};

NS.View.on({
	create: function(){
		this.controllers = {};
	},

	destroy: function(){
		delete this.controllers;
	}
});
