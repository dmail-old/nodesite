/* global View, ListenerHandler, EventHandler */

var Controller = new Class({
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

	constructor: function(view){
		this.eventsHandler = new EventHandler(null, this.events, this);
		this.viewEventsHandler = new ListenerHandler(null, this.viewEvents, this);
		this.setView(view);
	},

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

Controller.controllers = {};
Controller.register = function(name, controller){
	controller.prototype.name = name;
	this.controllers[name] = controller;
};
Controller.add = function(view, name){
	new this.controllers[name](view);
};

View.prototype.on('create', function(){
	this.controllers = {};
});

View.prototype.on('destroy', function(){
	for(var name in this.controllers){
		this.controllers[name].unsetView();
	}

	delete this.controllers;
});

