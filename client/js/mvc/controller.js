/* global View, viewDocument, EventHandler */

/*
viewDocument.on('create', function(view){
	view.controllers = Object.copy(view.controllers);
});
*/

viewDocument.on('setElement', function(view, element){
	view.controllers = {};
	Object.eachPair(view.controllers, function(name){
		view.addController(name);
	});
});

viewDocument.on('unsetElement', function(view, element){
	Object.eachPair(view.controllerDefinitions, function(name){
		view.removeController(name);
	});
});

var ControllerEventHandler = new Class({
	Extends: EventHandler,

	callHandler: function(handler, bind, e){
		var view = View(e);
		// e.detail.args[0] contient l'event qui à déclenché
		if( e instanceof CustomEvent && e.detail.args[0] instanceof Event ) e = e.detail.args[0];
		return handler.call(bind, view, e);
	}
});

var Controller = new Class({
	events: {},

	initialize: function(view){
		this.view = view;
		this.view.controllers.push(this);
		this.elementEvents = new ControllerEventHandler(view.element, this.events, this);
		this.elementEvents.listen();
	},

	destroy: function(){
		this.view.controllers.remove(this);
		this.elementEvents.stopListening();
	}
});

View.controllers = [];
View.getControllerDefinition = function(name){
	return View.controllers[name];
};
View.defineController = function(name, definition){
	var currentDefinition = View.getControllerDefinition(name);
	if( currentDefinition ) definition = Object.merge(currentDefinition, definition);

	View.controllers[name] = definition;
};

View.prototype.addController = function(name){
	var definition = View.getControllerDefinition(this.constructor, name);

	if( definition ){
		if( definition.condition && !definition.condition(this) ) return;
		this.controllers[name] = new definition.constructor(this);
	}
};

View.prototype.removeController = function(name){
	if( this.controllers[name] ){
		this.controllers[name].destroy();
	}
};
