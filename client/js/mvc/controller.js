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
	events: {},

	constructor: function(view){
		this.eventsHandler = new EventHandler(null, this.events, this);
		this.viewEventsHandler = new ListenerHandler(null, this.viewEvents, this);
		this.setView(view);
	},

	setView: function(view){
		if( view ){
			this.view = view;
			this.viewEventsHandler.emitter = view;
			this.viewEventsHandler.listen();
			if( this.view.element ) this.setElement(this.view.element);
		}
	},

	unsetView: function(){
		if( this.view ){
			this.viewEventsHandler.stopListening();
			delete this.viewEventsHandler.emitter;
			if( this.view.element && this.element == this.view.element ) this.unsetElement();
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

	destroy: function(){
		this.unsetView();
		this.unsetElement();
	}
});

Controller.controllers = {};
Controller.register = function(name, controller){
	this.controllers[name] = controller;
};
Controller.add = function(view, name){
	new this.controllers[name](view);
};
