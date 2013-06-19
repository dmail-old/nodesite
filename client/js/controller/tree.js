NS.TreeController = NS.Controller.extend(NS.childrenInterface, NS.treeTraversal, NS.treeFinder, {
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
