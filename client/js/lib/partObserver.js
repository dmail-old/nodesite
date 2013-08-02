// Object.watch polyfill
Object.complement({
	watch: function(prop, handler){
		var oldval = this[prop], newval = oldval

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

var ObjectEmitter = NS.Emitter.extend({
	instances: [],
	newSingleton: function(model){
		var instances = this.instances, i = 0, j = instances.length, instance, exist;

		for(;i<j;i++){
			instance = instances[i];
			if( instance.bind === model ){
				exist = instance;
				break;
			}
		}

		if( exist ){
			instance = exist;
		}
		else{
			instance = this.new(model);
			this.instances.push(instance);
		}

		return instance;
	},

	destroySingleton: function(model){
		// ce model est perdu, mais perdu que pour un model parent spécifique
	},

	watcher: function(name, oldValue, value){
		var has = name in this.bind;

		this.emit(name, {
			type: has ? 'updated' : 'new',
			name: name,
			oldValue: oldValue,
			value: value,
			model: this.bind
		});

		return value;
	},

	onaddfirstlistener: function(name){
		Object.prototype.watch.call(this.bind, name, this.watcher.bind(this));
	},

	onremovelastlistener: function(name){
		Object.prototype.unwatch.call(this.bind, name);
		// c'est le dernier listener pour cette propriété, sur cet objet
		// faudrais supprimer l'instance lorsque l'objet n'a plus aucun listener pour aucune propriétés
		console.log(this.$listeners);
	}
});

var PartObserver = {
	property: null, // can be number or string
	nextPart: null,
	previousPart: null,
	model: null,
	value: undefined,
	lastChange: null,
	listener: null,
	emitter: null,

	create: function(property, model, observer){
		this.property = property;
		if( arguments.length > 1 ){
			this.setModel(model);
			if( typeof observer == 'function' ){
				this.onchange = observer;
			}
		}
	},

	// lorsque la valeur associé à cette partie change dans this.model
	checkChange: function(change){
		if( !this.nextPart ) return;

		if( change.type == 'new' ){
			this.nextPart.setModel(change.value);
		}
		else if( change.type == 'updated' ){
			var prevChange = this.lastChange;

			// supprime l'ancien modèle
			this.nextPart.unsetModel();
			// définit le nouveau modèle
			this.nextPart.setModel(change.value);
		}
		else if( change.type == 'deleted' ){
			// un modèle nécéssaire à la résolution du chemin est supprimé
			// on perds forcément accès à la valeur qui devient undefined
			this.nextPart.unsetModel();
		}
	},

	watcher: function(change){
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

		this.lastChange = change;
		change = this.checkChange(change) || change;
		this.notify(change);
	},

	handleEvent: function(name, args){
		this.watcher(args[0]);
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
			this.emitter = ObjectEmitter.newSingleton(model);
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

		this.watcher(change);
	},

	unsetModel: function(fromSetModel){
		if( this.model != null ){

			if( this.emitter ){
				this.emitter.off(this.property);
				this.emitter = null;
			}

			this.model = null;

			if( !fromSetModel && this.lastChange ){
				this.watcher({
					type: 'deleted',
					name: this.property,
					oldValue: this.lastChange.value,
					value: undefined,
					model: this.lastChange.model
				});
			}
		}
	},

	notify: function(change){
		if( typeof this.listener == 'function' ){
			this.listener.call(this, change);
		}
	},

	set onchange(callback){
		this.listener = callback;
		if( this.lastChange ){
			this.notify(this.lastChange);
		}
	}
};
