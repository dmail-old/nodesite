/* global */

NS.EventEmitter = NS.Emitter.extend({
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
});

Object.eachPair(NS.EventEmitter, function(key, value, object){
	if( key != 'constructor' && key != '$events' ){
		Object.appendPair.call(window, key, value, object);
		Object.appendPair.call(document, key, value, object);
		Object.appendPair.call(Element.prototype, key, value, object);
	}
});
