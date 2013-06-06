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
		this.eventsHandler.callHandler = this.callHandler;
		this.viewEventsHandler = new ListenerHandler(null, this.viewEvents, this);
		this.setView(view);
	},

	callHandler: EventHandler.prototype.callHandler,

	setView: function(view){
		if( view ){
			this.view = view;

			this.view.controllers.push(this);

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

			this.view.controllers.remove(this);

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

Object.merge(Controller, Class.manager);

/*

By default a controller control one view, so events necessarily occur on that view
Some controller can control a view that contains subview
in that case we pass the view as first arguments for events
Such controller have to implement Controller.Node

*/

Controller.Node = {
	callHandler: function(handler, bind, e){
		var view = View(e);

		if( e instanceof CustomEvent ){
			return handler.apply(bind, [view].concat(e.detail.args));
		}
		return handler.call(bind, view, e);
	}
};

View.prototype.on('create', function(){
	this.controllers = [];
});

View.prototype.on('destroy', function(){
	this.controllers.forEach(function(controller){
		controller.unsetView();
	});
	delete this.controllers;
});

