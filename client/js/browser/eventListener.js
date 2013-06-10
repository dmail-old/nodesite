Item('listener').extend('event', {
	callHandler: function(handler, bind, e){
		return handler.call(bind, e);
	},

	handleEvent: function(e){
		var listener = this.listener, handlers = this.handlers, handler;

		if( handlers ){
			handler = this.handlers[e.type];
			if( typeof handler == 'string' ){
				handler = listener[handler];
			}
			if( typeof handler == 'object' ){
				listener = handler;
				handler = handler.handleEvent;
			}
			if( typeof handler == 'function' ){
				return this.callHandler(handler, listener, e);
			}
		}
	}
});

delete Item('listener.event').handleListener;
delete Item('listener.event').applyHandler;
