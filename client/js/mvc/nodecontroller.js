/* global Controller, View */

/*

By default a controller control one view, so events necessarily occur on that view
But with nodeView a controller control one view that can contain other views
it's why we pass the view as first arguments for events

*/

var NodeController = new Class(Controller, {
	constructor: function(){
		Controller.prototype.constructor.apply(this, arguments);

		this.eventsHandler.callHandler = function(handler, bind, e){
			var view = View(e);

			if( e instanceof CustomEvent ){
				return handler.apply(bind, [view].concat(e.detail.args));
			}
			return handler.call(bind, view, e);
		};
	}
});
