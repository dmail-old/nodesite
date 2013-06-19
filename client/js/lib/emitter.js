/*

name: Emitter

description: Emitter provide methods to emit and listen for events

require: Object

*/

NS.Emitter = {
	$listeners: {},

	constructor: function(bind){
		this.bind = bind;
	},

	getListeners: function(){
		if( this.hasOwnProperty('$listeners') ){
			return this.$listeners;
		}
		else{
			return this.$listeners = Object.clone(this.$listeners);
		}
	},

	listeners: function(name, create){
		var listeners = this.getListeners(), list = false;

		if( name in listeners ) list = listeners[name];
		else if( create ) list = listeners[name] = [];

		return list;
	},

	addListener: function(name, listener){
		if( typeof name != 'string' ) throw new TypeError('string expected for event name');
		if( typeof listener != 'function' && typeof listener != 'object' ){
			throw new TypeError('listener should be a function or object');
		}

		if( this.onaddlistener ) this.onaddlistener.apply(this, arguments);
		this.listeners(name, true).push(listener);

		return this;
	},

	removeListener: function(name, listener){
		var listeners = this.getListeners(), list, retain, i, j, item;

		if( name == null ){
			for(name in listeners) this.removeListener(name, listener);
			if( !listener ) this.deleteEvents();
		}
		else if( listener == null ){
			if( name in listeners ){
				[].concat(listeners[name]).forEach(function(listener){
					this.removeListener(name, listener);
				}, this);
			}
		}
		else if( name in listeners ){
			list = listeners[name];
			retain = listeners[name] = [];
			i = 0;
			j = list.length;

			for(;i<j;i++){
				item = list[i];

				if( item === listener || item.__listener === listener ){
					if( this.onremovelistener ) this.onremovelistener.apply(this, arguments);
				}
				else{
					retain.push(item);
				}
			}
			if( retain.length === 0 ) delete listeners[name];
		}

		return this;
	},

	addVolatileListener: function(name){
		var self = this, once, args = arguments;

		// transform the second argument (supposed to be a function)
		// into a function that remove herself before calling original function
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
		else return listener.apply(this.bind || this, args);
	},

	applyHandler: function(handler, name, args){
		return handler.handleListener(name, args);
	},

	onapplylisteners: function(name, args){
		if( name != '*' && name != 'addListener' && name != 'removeListener' ){
			this.applyListeners('*', arguments);
		}
	},

	applyListeners: function(name, args){
		var listeners = this.listeners(name), i, j;

		if( this.onapplylisteners && name != 'applyListeners' ) this.onapplylisteners.apply(this, arguments);

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
		var name = args[0], key;

		if( !name ){
			method.call(this);
		}
		else if( typeof name == 'string' ){
			if( RegExp.SPACE.test(name) ){
				name.split(RegExp.SPACE).forEach(function(name){
					args[0] = name;
					method.apply(this, args);
				}, this);
			}
			else{
				method.apply(this, args);
			}
		}
		else if( typeof name == 'object' ){
			args = toArray(args, 1);
			for(key in name){
				method.apply(this, [key, name[key]].concat(args));
			}
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

NS.EmitterInterface = {
	on: function(){
		return this.emitter.on.apply(this.emitter, arguments);
	},

	off: function(){
		return this.emitter.off.apply(this.emitter, arguments);
	},

	once: function(){
		return this.emitter.once.apply(this.emitter, arguments);
	},

	emit: function(){
		return this.emitter.emit.apply(this.emitter, arguments);
	}
};

/*

for later use

NS.Event = {
	constructor: function(name, target){
		this.name = name;
		this.target = target;
	},

	stopPropagation: function(){
		this.propagationStopped = true;
	},

	preventDefault: function(){
		this.defaultPrevented = true;
	},

	emit: function(target){
		this.currentTarget = target;
		target.emit(this);
		return !Boolean(this.propagationStopped);
	}
};

// emit event from this to the ancestors
NS.Emitter.bubble = function(name, args){
	var target = this, event = NS.Event.new(name, target);

	while( event.emit(target) ){
		target = target.parentNode;
		if( !target ) break;
	}

	return event;
};

// emit event from this to the descendant
NS.Emitter.capture = function(name, args){
	var target = this, event = NS.Event.new(name, target);

	target.crossNode(function(target){
		if( !target.emit(event) ) return true;
	}, null, true);

	return event;
};

*/
