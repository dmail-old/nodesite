/*

By default a controller control one view, so events necessarily occur on that view
Some controller can control a view that contains subview
in that case we pass the view as first arguments for events
Such controller have to extend controller.tree

*/

NS.TreeController = NS.Controller.extend({
	name: 'TreeController',
	constructor: function(){
		NS.Controller.constructor.apply(this, arguments);

		this.eventListener.callHandler = this.callHandler;
	},

	callHandler: function(handler, bind, e){
		var view = NS.View.cast(e);

		if( e instanceof CustomEvent ){
			return handler.apply(bind, [view].concat(e.detail.args));
		}
		return handler.call(bind, view, e);
	},
});
