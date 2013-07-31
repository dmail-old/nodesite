var PartObserver = {
	property: '',
	nextPart: null,
	previousPart: null,
	model: null,
	value: undefined,
	lastChange: null,
	listener: null,

	create: function(property){
		this.property = property;
	},

	isModel: function(value){
		return Model.isPrototypeOf(value);
	},

	// lorsque la valeur associé à cette partie change dans this.model
	checkChange: function(change){
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
			// not really a new change, the object is different but the value is just updated
			if( lastChange.type == 'new' && change.type == lastChange.type ){
				change.type = 'updated';
				change.oldValue = this.lastChange.value;
			}
		}

		this.lastChange = change;
		change = this.checkChange(change) || change;
		this.notify(change);
	},

	setModel: function(model){
		if( this.isModel(model) ){
			this.unsetModel(true);
			this.model = model;
			this.model.watch(this.property, this.watcher, this);

			if( model.has(this.property) ){
				this.watcher({
					type: 'new',
					name: this.property,
					oldValue: undefined,
					value: model.get(this.property),
					model: model
				});
			}
			else if( this.lastChange ){
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

	unsetModel: function(fromSetModel){
		if( this.model ){
			this.model.unwatch(this.property, this.watcher, this);
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
