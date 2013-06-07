/* global */

Class.extend('controller', {
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
		this.viewEventsHandler = Class.new('listener', null, this.viewEvents, this);
		this.eventsHandler = Class.new('listener.event', null, this.events, this);
		this.eventsHandler.callHandler = this.callHandler;

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
			provider = Class('controller').providers[name];

			if( provider ){
				instance = provider.call(this, this.view);
			}
			else{
				instance = Class.new('controller.' + name, this.view);
			}
		}

		this[name] = instance;
	},

	callHandler: Class('listener.event').prototype.callHandler,

	setView: function(view){
		if( view ){
			this.view = view;

			this.view.controllers[this.name] = this;

			this.viewEventsHandler.emitter = view;
			this.viewEventsHandler.listen();

			if( this.view.element ) this.setElement(this.view.element);
		}
	},

	unsetView: function(){
		if( this.view ){
			if( this.view.element && this.element == this.view.element ) this.unsetElement();

			this.viewEventsHandler.stopListening();
			delete this.viewEventsHandler.emitter;

			delete this.view.controllers[this.name];

			delete this.view;
		}
	},

	setElement: function(element){
		if( element ){
			this.eventsHandler.emitter = element;
			this.eventsHandler.listen();
		}
	},

	unsetElement: function(){
		if( this.element ){
			this.eventsHandler.stopListening();
			delete this.eventsHandler.emitter;
		}
	},

	getController: function(name){
		return this.view.controllers[name];
	},

	destroy: function(){
		this.unsetView();
		this.unsetElement();
	}
});

Class('controller').providers = {};

Class('view').prototype.on('create', function(){
	this.controllers = {};
});
Class('view').prototype.on('destory', function(){
	delete this.controllers;
});

/*

By default a controller control one view, so events necessarily occur on that view
Some controller can control a view that contains subview
in that case we pass the view as first arguments for events
Such controller have to implement Controller.Node

*/

Class('controller').Node = {
	callHandler: function(handler, bind, e){
		var view = Class('view')(e);

		if( e instanceof CustomEvent ){
			return handler.apply(bind, [view].concat(e.detail.args));
		}
		return handler.call(bind, view, e);
	}
};

