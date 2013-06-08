/* global */

Class.extend('emitter', 'event', {
	getEvents: function(){
		var listeners = this.storage.listeners;

		if( !listeners ) listeners = this.storage.listeners = {};
		
		return listeners;
	},

	deleteEvents: function(){
		this.storage.unset('listeners');
		return this;
	},

	onaddlistener: function(name, listener, capture){
		this.addEventListener(name, listener, capture);
	},

	onremovelistener: function(name, listener, capture){
		this.removeEventListener(name, listener, capture);
	},

	onapplylisteners: Function.EMPTY,

	applyHandler: function(handler, name, args){
		return handler.handleEvent(args[0]);
	}
});

Object.eachPair(Class('emitter.event').prototype, function(key, value, object){
	Object.setPair.call(window, key, value, object);
	Object.setPair.call(document, key, value, object);
	Object.setPair.call(Element.prototype, key, value, object);
});
