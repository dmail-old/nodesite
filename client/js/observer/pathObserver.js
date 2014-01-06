window.PathObserver = {
	path: '',
	firstPart: null,
	lastPart: null,
	closed: false,

	toString: function(){
		return 'PathObserver';
	},

	create: function(path, model, listener, bind, token){
		if( typeof path != 'string' ){
			throw new Error('path must be a string');
		}

		this.path = path;


		var parts = path.split('.'), i = 0, j = parts.length, currentPart, part;

		for(;i<j;i++){
			currentPart = window.PartObserver.new(parts[i]);

			if( part ){
				currentPart.previousPart = part;
				part.nextPart = currentPart;
			}
			part = currentPart;

			if( i === 0 ){
				this.firstPart = part;
			}
			if( i == j -1 ){
				this.lastPart = part;
			}
		}

		this.firstPart.setModel(model);
		this.lastPart.token = token;
		this.lastPart.onChange(listener, bind || this);
	},

	close: function(){
		// all part must be closed
		if( this.closed === false ){
			// closing firstPart auto close nextParts
			this.firstPart.close();
			this.closed = true;
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
