// Object.watch polyfill
Object.complement({
	watch: function(prop, handler){
		var oldval = this[prop], newval = oldval;

		function getter(){
			return newval;
		}

		function setter(val){
			oldval = newval;
			return newval = handler.call(this, prop, oldval, val);
		}

		if( delete this[prop] ){ // can't watch constants
			Object.defineProperty(this, prop, {
				get: getter,
				set: setter,
				enumerable: true,
				configurable: true
			});
		}
	},

	unwatch: function(prop){
		var val = this[prop];
		delete this[prop]; // remove accessors
		this[prop] = val;
	}
});

var ObjectChangeEmitter = NS.Emitter.extend({
	instances: [],
	
	// on pourrait aussi utiliser un double tableau genre objects: [], instances: [], plus rapide je pense
	getInstanceFor: function(model){
		var instances = this.instances, i = 0, j = instances.length, instance;

		for(;i<j;i++){
			instance = instances[i];
			if( instance.bind === model ){
				return instance;
			}
		}

		return null;
	},

	newSingleton: function(model){
		var instance = this.getInstanceFor(model);

		if( !instance ){
			instance = this.new(model);
			this.instances.push(instance);
		}

		return instance;
	},

	watcher: function(name, oldValue, value){
		if( oldValue != value ){
			this.emit(name, name, oldValue, value);
		}		
		return value;
	},

	onaddfirstlistener: function(name){
		Object.prototype.watch.call(this.bind, name, this.watcher.bind(this));
	},

	onremovelastlistener: function(name){
		Object.prototype.unwatch.call(this.bind, name);
		// c'est le dernier listener pour cette propriété, sur cet objet
		// faudrais supprimer l'instance lorsque l'objet n'a plus aucun listener pour aucune propriété
		if( Object.isEmpty(this.$listeners) ){
			this.instances.remove(this);
		}
	}
});

var PropertyObserver = {
	closed: false,
	property: null, // Number|String
	model: null,
	lastChange: null,
	listener: null,
	emitter: null,

	toString: function(){
		return 'PropertyObserver';
	},

	create: function(property, model, listener, bind){
		this.property = property;
		this.setModel(model);
		if( typeof listener == 'function' ){
			this.onChange(listener, bind);
		}
	},

	notify: function(change){
		this.lastChange = change;
		if( typeof this.listener == 'function' ){
			this.listener.call(this.bind, change);
		}
	},

	notifyChange: function(change){
		var lastChange = this.lastChange;

		if( lastChange ){
			// no real change, the object is different but the value still the same
			if( change.value == lastChange.value ){
				return;
			}
			// not a new change: the value is updated
			if( lastChange.type == 'new' && change.type == lastChange.type ){
				change.type = 'updated';
				change.oldValue = this.lastChange.value;
			}
		}

		this.notify(change);
	},

	watcher: function(name, oldValue, value){
		this.notifyChange({
			type: name in this.model ? 'updated' : 'new',
			name: name,
			oldValue: oldValue,
			value: value,
			model: this.model
		});
	},

	handleEvent: function(name, args){
		this.watcher.apply(this, args);
	},

	isPrimitive: function(value){
		var type = typeof value;
		return type == 'number' || type == 'boolean' || type == 'string';
	},

	setModel: function(model){
		this.unsetModel(true);
		this.model = model;

		var change = {
			type: 'new',
			name: this.property,
			oldValue: undefined,
			value: undefined,
			model: model
		};

		// null & undefined cant be watched and dont have property
		if( model === null || model === undefined ){
			// let change object untouched
		}
		// primitive cant be watched but does have native property (valueOf, toString,...)
		else if( this.isPrimitive(model) ){
			change.value = model[this.property];
		}
		// object, function
		else{
			this.emitter = ObjectChangeEmitter.newSingleton(model);
			this.emitter.on(this.property, this);

			// model have the property
			if( this.property in model ){
				change.value = model[this.property];
			}
			// model doesn't have the property but the previous model had it
			else if( this.lastChange ){
				change.type = 'deleted'; // we lost the pointer on that property
				change.oldValue = this.lastChange.value;
				change.model = this.lastChange.model;
			}
			else{
				// let change object untouched
			}
		}

		this.notifyChange(change);
	},

	unsetModel: function(supressNotify){
		if( this.model != null ){

			if( this.emitter ){
				this.emitter.off(this.property, this);
				this.emitter = null;
			}
			// close the model if model is a ComputedBinding
			if( typeof this.model.close == 'function' ){
				this.model.close();
			}

			this.model = null;

			if( !supressNotify && this.lastChange ){
				this.notifyChange({
					type: 'deleted',
					name: this.property,
					oldValue: this.lastChange.value,
					value: undefined,
					model: this.lastChange.model
				});
			}
		}
	},

	onChange: function(listener, bind){
		this.listener = listener;
		this.bind = bind || this;
		this.notify(this.lastChange || {
			type: 'new',
			name: this.property,
			oldValue: undefined,
			value: undefined,
			model: this.model
		});
	},

	close: function(){
		if( this.closed === false ){
			this.unsetModel(true);
			this.closed = true;
		}
	}
};
