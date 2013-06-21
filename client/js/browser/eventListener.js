NS.EventListener = NS.Listener.extend({
	setListener: function(element, value, name, listener){
		element[value ? 'addEventListener' : 'removeEventListener'](name, listener);
	},

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
