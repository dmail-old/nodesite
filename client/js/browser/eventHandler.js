/* global ListenerHandler */

var EventHandler = new Class({
	Extends: ListenerHandler,

	callHandler: function(handler, bind, e){
		return handler.call(bind, e);
	},

	handleEvent: function(e){
		var listener = this.listener, handler = this.handlers[e.type];

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
});
delete EventHandler.prototype.handleListener;
