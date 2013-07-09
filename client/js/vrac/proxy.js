var Proxy = new Class({
	codes: {
		has: function(target, name){ return key in target; },
		get: function(target, name){ return target[name]; },
		set: function(target, name, value){ target[name] = value; },
		delete: function(target, name){ delete target[name]; },
		apply: function(target, name, bind, args){ return target[name].apply(bind, args); },
		call: function(target, name, bind){ return this.codes.apply.apply(name, bind, toArray(arguments, 3)); }
	},

	initialize: function(target, handler){
		this.target = target;
		this.handler = handler;
	},

	hasTrap: function(operation){
		return this.handler && typeof this.handler[operation] == 'function';
	},

	getTrap: function(operation){
		return this.handler[operation];
	},

	trap: function(operation, args){
		this.applyTrap(this.getTrap(operation), args);
	},

	applyMethod: function(method, bind, args){
		return fn.apply(this, [this.target].concat(args));
	},

	applyTrap: function(method, args){
		return this.applyMethod(method, this, args);
	},

	applyCode: function(method, args){
		return this.applyMethod(method, this, args);
	}
});

Object.eachPair(Proxy.prototype.codes, function(operation, method){
	Proxy.prototype[operation] = function(){
		var args = toArray(arguments);
		if( this.hasTrap(operation) ){
			this.trap(operation, args);
		}
		else{
			this.applyCode(Proxy.prototype.codes[method], args);
		}
	};
});

var AssocProxy = new Class({
	Extends: Proxy,

	initialize: function(target, handler){
		this.target = target;
		this.handler = handler;
	},

	has: function(name){
		return name in this.target;
	},

	set: function(name, value){
		this.target[name] = new Proxy(value, this.handler);
	},

	remove: function(key){
		if( this.has(name) ){
			var proxy = this.get(name);
			proxy.forEach(proxy.remove, proxy);
			delete this.target[name];
		}
	},

	applyTrap: function(method, args){
		args.splice(1, 1); // pas besoin de part
		return method.apply(this, args);
	},

	hasTrap: function(operation, part){
		return this.handler && part in this.handler && typeof this.handler[part][operation] == 'function';
	},

	getTrap: function(operation, part){
		return this.handler[part][operation];
	},

	hasPart: function(name, part){
		if( this.has(name) ){
			return this.hasTrap('has', part) ? this.trap('has', arguments) : part in this.get(name);
		}
		return false;
	},

	getPart: function(name, part){
		if( this.has(name) ){
			if( this.hasTrap('get', part) ){
				return this.trap('get', arguments);
			}
			return this.get(name)[part];
		}
		return undefined;
	},

	setPart: function(name, part, value){
		if( !this.has(name) ) this.set(name, {});
		if( this.hasTrap('set', part) ){
			this.trap('set', arguments);
		}
		else{
			this.get(name)[part] = value;
		}
	},

	removePart: function(name, part){
		if( this.has(name) ){
			if( this.hasTrap('remove', part) ){
				this.trap('remove', arguments);
			}
			else{
				delete this.get(name)[part];
			}
		}
	},

	applyPart: function(name, part, bind, args){
		if( this.hasPart(name, part) ){
			var value = this.getPart(name, part);
			return typeof value == 'function' ? value.apply(part, bind, args) : undefined;
		}
		return undefined;
	},

	callPart: function(name, part, bind){
		return this.applySchemaPart(name, part, bind, toArray(arguments, 3));
	}
});

NS.Proxy = {
	target: null,
	handler: {},

	create: function(target, handler){
		this.target = target;
		this.handler = handler;
	},

	has: function(name){
		if( this.handler.has ){
			return this.handler.has(this.target, name);
		}
		return this.target.has(name);
	},

	get: function(name){
		if( this.handler.get ){
			return this.handler.get(this.target, name);
		}
		return this.target.get(name);
	},

	set: function(name, value){
		if( this.handler.get ){
			return this.handler.set(this.target, name, value);
		}
		return this.target.set(name, value);
	},

	unset: function(name){
		if( this.handler.unset ){
			return this.handler.unset(this.target, name);
		}
		return this.target.unset(name);
	}
};
