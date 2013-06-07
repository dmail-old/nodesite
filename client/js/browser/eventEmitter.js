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

delete Class('emitter.event').prototype.$events;

var eventEmitterProto = Class('emitter.event').prototype;

for(var key in eventEmitterProto){
	if( key != 'constructor' ){
		window[key] = eventEmitterProto[key];
		document[key] = eventEmitterProto[key];
		Element.prototype[key] = eventEmitterProto[key];
	}	
}