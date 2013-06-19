NS.EventEmitter = NS.Emitter.extend({
	applyHandler: function(handler, name, args){
		return handler.handleEvent(args[0]);
	},

	onaddlistener: function(name, listener, capture){
		this.bind.addEventListener(name, listener, capture);
	},

	onremovelistener: function(name, listener, capture){
		this.bind.removeEventListener(name, listener, capture);
	}
});

