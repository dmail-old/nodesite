/*
it may be usefull to know if a specific event is being listened
*/

NS.EventListener = {
	handlers: null,
	emitter: null,
	listener: null,
	listening: false,

	create: function(emitter, handlers, listener){
		this.emitter = emitter;
		if( handlers ) this.handlers = handlers;
		this.listener = listener || this;
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
				return handler.call(listener, e);
			}
		}
	},

	setListener: function(emitter, value, name, listener){
		emitter[value ? 'on' : 'off'](name, listener);
	},

	toggle: function(name, value){
		var emitter = this.emitter;

		if( emitter ){
			this.setListener(emitter, value, name, this);
		}

		return this;
	},

	add: function(name, listener){
		var exists = false;

		if( this.handlers ){
			exists = name in this.handlers;
		}
		else{
			this.handlers = {};
		}

		this.handlers[name] = listener;

		// dont listen twice
		if( !exists && this.listening ) this.enable(name);
	},

	remove: function(name){
		if( this.handlers ){
			if( this.listening ) this.disable(name);
			delete this.handlers[name];
		}
	},

	enable: function(name){
		return this.toggle(name, true);
	},

	disable: function(name){
		return this.toggle(name, false);
	},

	listen: function(){
		if( this.handlers ) Object.eachPair(this.handlers, this.enable, this);
		this.listening = true;
		return this;
	},

	stopListening: function(){
		if( this.handlers ) Object.eachPair(this.handlers, this.disable, this);
		this.listening = false;
		return this;
	}
};