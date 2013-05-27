/* global Emitter */

var EventEmitter = Object.append(Object.clone(Emitter), {
	getEvents: function(){
		if( !this.storage.has('listeners') ) this.storage.set('listeners', {});
		return this.storage.get('listeners');
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

delete EventEmitter.$events;

Object.merge(Element.prototype, EventEmitter);
Object.merge(window, EventEmitter);
Object.merge(document, EventEmitter);
