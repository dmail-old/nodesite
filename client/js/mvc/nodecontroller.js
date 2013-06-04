/* global Controller, View */

/*

By default a controller control one view, so events necessarily occur on that view
But with nodeView a controller control one view that can contain other views
it's why we pass the view as first arguments for events

*/

var NodeController = new Class({
	Extends: Controller,

	constructor: function(){
		Controller.prototype.constructor.apply(this, arguments);

		this.eventsHandler.callHandler = function(handler, bind, e){
			var view = View(e);

			// the view in charge to handle subview isn't considered
			//if( view == bind.view ) view = null;

			if( e instanceof CustomEvent ){
				return handler.apply(bind, [view].concat(e.detail.args));
			}
			return handler.call(bind, view, e);
		};
	}
});

NodeController.controllers = {};
NodeController.create = Controller.create;
NodeController.add = Controller.add;
