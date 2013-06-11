NS.Item = {
	implementPair: function(key, value){

		if( typeof value == 'object' && value !== null ){
			var current = this[key];
			// when an object exists in this and in value for key
			// we create an object heriting from current then we merge it
			if( typeof current == 'object' && current !== null ){
				current = this[key] = Object.create(current);
				Object.eachOwnPair(value, NS.Item.implementPair, current);
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
		Array.eachObject(arguments, 'eachPair', NS.Item.implementPair, this);
		return this;
	},

	extend: function(){
		var object = Object.create(this);

		NS.Item.implement.apply(object, arguments);

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
		var proto = NS.Item.getPrototype.call(this);
		return proto ? NS.Item.getPrototype.call(proto) : null;
	}
};

NS.options = {
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
};

NS.chain = {
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
};

NS.bound = {
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
};
