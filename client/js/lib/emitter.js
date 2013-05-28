/*

name: Emitter

description: Emitter provide methods to emit and listen for events

require: Class, Object

*/

window.Emitter = {
	$events: {},

	getEvents: function(){
		if( !this.hasOwnProperty('$events') ) this.$events = Object.clone(this.$events);
		return this.$events;
	},

	deleteEvents: function(){
		delete this.$events;
	},

	onaddlistener: function(){
		this.applyListeners('addListener', arguments);
	},

	onremovelistener: function(){
		this.applyListeners('removeListener', arguments);
	},

	onapplylisteners: function(name){
		this.applyListeners('applyListener', arguments);
		if( name != 'addListener' && name != 'removeListener' && name != '*' ){
			this.applyListeners('*', arguments);
		}
	},

	listeners: function(name, create){
		var events = this.getEvents(), listeners = false;

		if( name in events ) listeners = events[name];
		else if( create ) listeners = events[name] = [];

		return listeners;
	},

	addListener: function(name, listener){
		if( typeof name != 'string' ) throw new TypeError('string expected for event name');
		if( typeof listener != 'function' && typeof listener != 'object' ){ console.trace(); throw new TypeError('listener should be a function or object'); }

		this.onaddlistener.apply(this, arguments);
		this.listeners(name, true).push(listener);

		return this;
	},

	removeListener: function(name, listener){
		var events = this.getEvents(), list, retain, i, j, item;

		if( name == null ){
			for(name in events) this.removeListener(name, listener);
			if( !listener ) this.deleteEvents();
		}
		else if( listener == null ){
			if( name in events ){
				[].concat(events[name]).forEach(function(listener){
					this.removeListener(name, listener);
				}, this);
			}
		}
		else if( name in events ){
			list = events[name];
			retain = events[name] = [];
			i = 0;
			j = list.length;

			for(;i<j;i++){
				item = list[i];

				if( item === listener || item.__listener === listener ){
					this.onremovelistener.apply(this, arguments);
				}
				else{
					retain.push(item);
				}
			}
			if( retain.length === 0 ) delete events[name];
		}

		return this;
	},

	addVolatileListener: function(name){
		var self = this, once, args = arguments;

		// transform the second argument (supposed to be a function) into a function that remove herself before calling original function
		once = function(){
			self.removeListener.apply(self, args);
			return once.__listener.apply(this, arguments);
		};
		once.__listener = args[1];
		args[1] = once;

		return this.addListener.apply(this, args);
	},

	applyListener: function(listener, name, args){
		if( typeof listener == 'object' ) return this.applyHandler(listener, name, args);
		else return listener.apply(this, args);
	},

	applyHandler: function(handler, name, args){
		return handler.handleListener(name, args);
	},

	applyListeners: function(name, args){
		var listeners = this.listeners(name), i, j;

		if( name != 'applyListener' ) this.onapplylisteners.apply(this, arguments);

		if( listeners ){
			i = -1;
			j = listeners.length;
			while(++i < j) this.applyListener(listeners[i], name, args);
		}

		return this;
	},

	callListeners: function(name){
		return this.applyListeners(name, toArray(arguments, 1));
	},

	/*
	implement multiple event writing style:
	on({focus: function(){}, blur: function(){}});
	off('focus blur');
	emit('focus blur', true);
	*/
	eachEvent: function(method, args){
		var name = args[0];

		if( !name ){
			method.call(this);
		}
		else if( typeof name == 'string' ){
			if( RegExp.SPACE.test(name) ){
				name.split(RegExp.SPACE).forEach(function(name){ args[0] = name; method.apply(this, args); }, this);
			}
			else{
				method.apply(this, args);
			}
		}
		else if( typeof name == 'object' ){
			args = toArray(args, 1);
			Object.eachPair(name, function(key, value){
				method.apply(this, [key, value].concat(args));
			}, this);
		}

		return this;
	},

	on: function(){
		return this.eachEvent(this.addListener, arguments);
	},

	off: function(){
		return this.eachEvent(this.removeListener, arguments);
	},

	once: function(){
		return this.eachEvent(this.addVolatileListener, arguments);
	},

	emit: function(){
		return this.eachEvent(this.callListeners, arguments);
	}
};
