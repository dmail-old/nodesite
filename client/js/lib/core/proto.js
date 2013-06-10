Item('proto', {
	// set key/value pair in this creating conflictual object and merging them
	implementPair: function(key, value){

		if( typeof value == 'object' && value !== null ){
			var current = this[key];
			if( typeof current == 'object' && current !== null ){
				current = this[key] = Object.create(current);
				Object.eachOwnPair(value, Item('proto').implementPair, current);
			}
			else{
				Object.setPair.apply(this, arguments);
			}
		}
		else{
			Object.setPair.apply(this, arguments);
		}

		return this;
	},

	implement: function(){
		Array.eachObject(arguments, 'eachPair', this.implementPair, this);
		return this;
	},

	// return object giving him name & implement other arguments
	extend: function(name){
		if( '__name__' in this ){
			name = this.__name__ + '.' + name;
		}

		var object = Object.create(this), i = 1, j = arguments.length, arg;

		for(;i<j;i++){
			arg = arguments[i];
			if( typeof arg == 'string' ) arg = Item(arg);
			object.implement(arg);
		}

		//object.__name__ = name;
		Object.defineProperty(object, '__name__', {
			writable: true,
			ennumerable: false,
			value: name
		});

		Item(name, object);

		return object;
	},

	// return an instance of this calling it's constructor
	new: function(){
		var instance = Object.create(this), constructor = instance.constructor;

		if( typeof constructor == "function" ) instance.constructor.apply(instance, arguments);

		return instance;
	},

	getPrototype: function(){
		return Object.getPrototypeOf(this);
	},

	getParentPrototype: function(){
		return this.getPrototype().getPrototype();
	}
});

Item('options', {
	setOptions: function(options){

		// only if this has not yet an options object
		if( !this.hasOwnProperty('options') ){
			// create object derived from parent options
			if( 'options' in this ){
				this.options = Object.copy(this.options);
			}
			else{
				this.options = {};
			}
		}

		if( options ){
			Object.merge(this.options, options);
		}

		return this;
	}
});

Item('chain', {
	resetChain: function(){
		this.$chain = [];
	},

	chain: function(){
		this.$chain.push(arguments);
		return this;
	},

	callChain: function(){
		if( this.$chain.length ){
			var
				call = this.$chain.shift(),
				method = call[0],
				bind = call[1] || this,
				args = call[2] || []
			;

			return method.apply(bind, args);
		}
		return false;
	},

	clearChain: function(){
		this.$chain = [];
		return this;
	}
});

Item('bound', {
	resetBound: function(){
		this.bound = {};
	},

	bind: function(){
		var bound = this.bound, i = arguments.length, key, value;

		while(i--){
			key = arguments[i];
			value = this[key];
			if( typeof value == 'function' ) bound[key] = value.bind(this);
		}

		return bound[key];
	}
});
