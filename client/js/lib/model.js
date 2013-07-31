var Model = {
	data: {},

	create: function(data){
		this.watchers = {};
		this.setData(data);
	},

	setData: function(data){
		this.data = {};
		if( data ){
			for(var key in data){
				this.set(key, data[key]);
			}
		}
	},

	has: function(name){
		return name in this.data;
	},

	get: function(name){
		return this.data[name];
	},

	set: function(name, value){
		var has = this.has(name), oldValue = undefined;

		if( has ){
			oldValue = this.get(name);
		}

		this.data[name] = value;

		if( name in this.watchers ){
			this.watchers[name]({
				type: has ? 'updated' : 'new',
				name: name,
				oldValue: oldValue,
				value: value,
				model: this
			});
		}

		return value;
	},

	unset: function(name){
		if( this.has(name) ){
			var oldValue = this.get(name);

			delete this.data[name];

			if( name in this.watchers ){
				this.watchers[name]({
					type: 'deleted',
					name: name,
					oldValue: oldValue,
					value: undefined,
					model: this
				});
			}
		}
	},

	watch: function(name, listener, bind){
		if( bind ) listener = listener.bind(bind);
		this.watchers[name] = listener;
	},

	unwatch: function(name, listener){
		delete this.watchers[name];
	}
};
