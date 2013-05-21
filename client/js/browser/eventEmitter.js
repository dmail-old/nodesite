// eventEmitter
var EventEmitter = new Class({
	Extends: Emitter,
	
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

delete EventEmitter.prototype.$events;
[Element.prototype, window, document].callEach(Object.appendThis, EventEmitter);

var EventHandler = {
	events: {},
	
	handleEvent: function(e){
		var handler = this.events[e.type], bind = this;
			
		if( typeof handler == 'string' ){
			handler = this[handler];
		}
		if( typeof handler == 'object' ){
			bind = handler;
			handler = handler.handleEvent;
		}
		if( typeof handler == 'function' ){
			return handler.call(bind, e);
		}
	}
};
