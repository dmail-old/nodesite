var PathObserver = {
	path: '',
	firstPart: null,
	lastPart: null,

	create: function(path, model, observer){
		this.path = path;

		var parts = path.split('.'), i = 0, j = parts.length, currentPart, part;

		for(;i<j;i++){
			currentPart = PartObserver.new(parts[i]);

			if( part ){
				currentPart.previousPart = part;
				part.nextPart = currentPart;
			}
			part = currentPart;

			if( i == 0 ){
				this.firstPart = part;
			}
			if( i == j -1 ){
				this.lastPart = part;
			}
		}

		if( model ){
			this.firstPart.setModel(model);
		}
		if( observer ){
			this.lastPart.onchange = observer;
		}

		// path not resolved, tel that the path value is undefined
		if( this.lastPart.lastChange == null ){
			this.lastPart.watcher({
				type: 'new',
				name: this.lastPart.property,
				oldValue: undefined,
				value: undefined,
				model: undefined
			});
		}
	}
};

/*
ObjectPath = {
	getValue: function(){
		var object = this.object, path = this.computedPath, value;
		var i = 0, j = path.length - 1, part;
		for(;i<j;i++){
			part = path[i];
			if( this.has(object, part) ){
				object = this.getProperty(object, part);
				if( !this.is(object) ){
					break;
				}
			}
			else{
				break;
			}
		}

		this.getProperty(object, path[j+1], value);

		return value;
	},

	setValue: function(value){
		var object = this.object, path = this.computedPath;
		var i = 0, j = path.length - 1, part;
		for(;i<j;i++){
			part = path[i];
			if( this.hasProperty(object, part) ){
				object = this.getProperty(object, part);
				if( this.is(object) ) continue;
			}
			object = this.setProperty(object, part, this.createInstance());
		}
		this.setProperty(object, path[j], value);
	}
};
*/
