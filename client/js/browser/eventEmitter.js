var exports = {
	getEvents: function(){
		var listeners = this.storage.listeners;

		if( !listeners ) listeners = this.storage.listeners = {};

		return listeners;
	},

	deleteEvents: function(){
		this.storage.unset('listeners');
		return this;
	},

	applyHandler: function(handler, name, args){
		return handler.handleEvent(args[0]);
	},

	onaddlistener: function(name, listener, capture){
		this.addEventListener(name, listener, capture);
	},

	onremovelistener: function(name, listener, capture){
		this.removeEventListener(name, listener, capture);
	}
};

exports = NS.Emitter.extend(exports);
NS.EventEmitter = exports;
