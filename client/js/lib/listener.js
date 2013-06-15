NS.Listener = Object.prototype.extend({
	handlers: null,

	constructor: function(emitter, handlers, listener){
		this.emitter = emitter;
		if( handlers ) this.handlers = handlers;
		this.listener = listener || this;
	},

	applyHandler: function(handler, bind, args){
		return handler.apply(bind, args);
	},

	handleListener: function(name, args){
		var listener = this.listener, handlers = this.handlers, handler;

		if( handlers ){
			handler = this.handlers[name];
			if( typeof handler == 'string' ){
				handler = listener[handler];
			}
			if( typeof handler == 'object' ){
				listener = handler;
				handler = handler.handleListener;
			}
			if( typeof handler == 'function' ){
				return this.applyHandler(handler, listener, args);
			}
		}
	},

	toggle: function(value, args){
		var emitter = this.emitter;

		if( emitter ){
			emitter[value ? 'on' : 'off'].apply(emitter, args);
		}

		return this;
	},

	add: function(){
		return this.toggle(true, arguments);
	},

	remove: function(){
		return this.toggle(false, arguments);
	},

	enable: function(name){
		return this.add(name, this);
	},

	disable: function(name){
		return this.remove(name, this);
	},

	listen: function(){
		if( this.handlers ) Object.eachPair(this.handlers, this.enable, this);
		return this;
	},

	stopListening: function(){
		if( this.handlers ) Object.eachPair(this.handlers, this.disable, this);
		return this;
	}
});
