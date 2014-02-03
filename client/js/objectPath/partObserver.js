window.PartObserver = (function(Part){

	var PartObserver = Part.extend({
		closed: false,
		lastChange: null,
		listener: null,
		emitter: null,
		id: undefined, // id of this observer

		toString: function(){
			return 'PartObserver';
		},

		create: function(name, model, listener, bind, id){
			Part.create.call(this, name);

			this.setModel(model);
			if( typeof listener == 'function' ){
				this.onChange(listener, bind);
			}
			this.id = id;
		},

		// ne fais rien notify s'en charge
		propagate: function(){

		},

		notify: function(change){
			this.lastChange = change;
			
			if( this.nextPart ){
				this.nextPart.setModel(change.value);
			}

			if( typeof this.listener == 'function' ){
				this.listener.call(this.bind, change, this.id);
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

		onChange: function(listener, bind){
			this.listener = listener;
			this.bind = bind || this;
			this.notify(this.lastChange || {
				type: 'new',
				name: this.name,
				oldValue: undefined,
				value: undefined,
				model: this.model
			});
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
				name: this.name,
				oldValue: undefined,
				value: undefined,
				model: model
			};

			// null & undefined cant be watched and dont have property
			if( model === null || model === undefined ){
				// let change object untouched
			}
			// '{} or {user.}' means bind to the model, in fact means bind to toString()
			else if( this.name === '' ){
				change.value = model;
			}
			// primitive cant be watched but does have native property (valueOf, toString,...)
			else if( this.isPrimitive(model) ){
				change.value = model[this.name];
			}
			// object, function
			else{
				this.emitter = window.ObjectChangeEmitter.new(model);
				this.emitter.on(this.name, this);

				// model have the property
				if( this.name in model ){
					change.value = model[this.name];
				}
				// model doesn't have the property but the previous model had it
				else if( this.lastChange ){
					change.type = 'deleted'; // we lost the pointer on that property
					change.oldValue = this.lastChange.value;
					change.model = this.lastChange.model;
				}
				else{
					// let change untouched
				}
			}

			this.notifyChange(change);
		},

		unsetModel: function(supressNotify){
			if( this.model != null ){

				if( this.emitter ){
					this.emitter.off(this.name, this);
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
						name: this.name,
						oldValue: this.lastChange.value,
						value: undefined,
						model: this.lastChange.model
					});
				}
			}
		},

		close: function(){
			if( this.closed === false ){
				this.unsetModel(true);
				this.closed = true;
			}
		}
	});

	return PartObserver;

})(window.PathPart);
