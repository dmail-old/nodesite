/*

name: Emitter

description: Emitter provide methods to emit and listen for events

require: Object

*/

NS.Emitter = {
	$listeners: {},

	create: function(bind){
		this.bind = bind || this;
		this.$listeners = Object.create(this.$listeners);
	},

	listeners: function(name){
		var listeners = this.$listeners;

		if( name in listeners ) list = listeners[name];
		else list = false;

		return list;
	},

	addListener: function(name, listener){
		if( typeof name != 'string' && typeof name != 'number' ){
			throw new TypeError('string expected for event name ' + name + ' given');
		}
		if( typeof listener != 'function' && typeof listener != 'object' ){
			throw new TypeError('listener should be a function or object');
		}

		var listeners = this.$listeners;

		if( name in listeners ){
			listeners[name].push(listener);
		}
		else{
			listeners[name] = [listener];
			if( this.onaddfirstlistener ) this.onaddfirstlistener.apply(this, arguments);
		}

		if( this.onaddlistener ) this.onaddlistener.apply(this, arguments);

		return this;
	},

	removeListener: function(name, listener){
		var listeners = this.$listeners, list, retain, i, j, item;

		if( name == null ){
			for(name in listeners) this.removeListener(name, listener);
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
			if( retain.length === 0 ){
				delete listeners[name];
				if( this.onremovelastlistener ){
					this.onremovelastlistener.apply(this, arguments);
				}
			}
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

	applyListener: function(listener, args, name){
		if( typeof listener == 'object' ){
			return listener.handleEvent(name, args);
		}
		else{
			return listener.apply(this.bind, args);
		}
	},

	applyListeners: function(name, args){
		var listeners = this.listeners(name), i, j;

		if( name != 'applyListeners' && name != 'addListener' && name != 'removeListener' && name != '*' ){
			this.applyListeners('*', arguments);
		}

		if( listeners ){
			i = 0;
			j = listeners.length;
			for(;i<j;i++){
				this.applyListener(listeners[i], args, name);
			}
		}

		return this;
	},

	callListeners: function(name){
		return this.applyListeners(name, Array.slice(arguments, 1));
	},

	/*

	implement multiple event writing style:
	on({focus: function(){}, blur: function(){}});
	off('focus blur');
	emit('focus blur', true);
	*/
	eachEvent: function(method, args){
		var name = args[0], key;

		if( args.length === 0 ){
			method.call(this);
		}
		else if( typeof name == 'string' ){
			if( RegExp.BLANK.test(name) ){
				args[0] = name.split(RegExp.BLANK);
				return this.eachEvent(method, args);
			}
			else{
				method.apply(this, args);
			}
		}
		else if( typeof name == 'number' ){
			method.apply(this, args);
		}
		else if( name instanceof Array ){
			name.forEach(function(name){
				args[0] = name;
				method.apply(this, args);
			}, this);
		}
		else if( typeof name == 'object' ){
			args = Array.slice(args, 1);
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
