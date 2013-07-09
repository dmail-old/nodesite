NS.Model = {
	id: 0,
	emitter: null,
	data: {},
	name: '',

	create: function(data){
		this.emitter = NS.Emitter.new(this);
		this.id = this.id++;

		if( data ) this.setData(data);
	},

	toJSON: function(){
		return this.data;
	},

	hasData: function(){
		return this.hasOwnProperty('data');
	},

	setData: function(data){
		this.data = data;

		if( this.has('name') ) this.name = this.get('name');
		if( this.has('childNodes') ) this.childNodes = this.get('childNodes');

		this.emit('data', data);
	},

	watch: function(key, listener, bind){
		bind = bind || this;
		this.on('change:' + key, function(value, oldvalue){
			listener.call(bind, value, oldvalue);
		});
	},

	change: function(key, value, current){
		this.emit('change', key, value, current);
		this.emit('change:' + key, value, current);
	},

	has: function(key){
		return key in this.data;
	},

	get: function(key){
		return this.data[key];
	},

	set: function(key, value){
		var current;

		current = this.get(key);
		if( current !== value ){
			this.change(key, value, current);
			this.data[key] = value;

			return true;
		}

		return false;
	},

	unset: function(key){
		var current;

		if( this.has(key) ){
			current = this.get(key);
			delete this.data[key];
			this.change(key, undefined, current);

			return true;
		}

		return false;
	}
}.supplement(
	NS.EmitterInterface,
	NS.NodeInterface,
	NS.NodeFinder
);

NS.modelDocument = NS.Document.new();
NS.modelDocument.oninsert = function(node, child){
	node.emit('adopt', child, node.childNodes.indexOf(child));
};
NS.modelDocument.onremove = function(node){
	node.emit('emancipate');
};

/*

for later use

NS.servermodel = {
	definitions: {
		parsers: {},
		cancels: {},
		prevents: {},
		methods: {
			update: function(key, value){ this.set(key, value); },
			obtain: function(key, value){ this.set(key, value); }
		},
	},

	createAction: function(name, args){
		var action = NS('action').new(this, name, args);
		return action;
	},

	send: function(name, args, callback){
		callback = callback || function(){ console.log(arguments); };

		var action = this.createAction(name, args);

		if( action.isCancelled() ){
			callback.call(this, new Error('cancelled'));
		}
		else if( !action.isValid() ){
			callback.call(this, new Error(action + 'invalid'));
		}
		else{
			this.emit('send', action);

			this.sync(action, function(error, response){
				this.emit('complete', action);

				if( error ) return callback.call(this, error);

				action.exec();
				callback.call(this, null, response);

			}.bind(this));
		}

		return this;
	},

	update: function(key, value, callback){
		return this.send('update', [key, value], callback);
	},

	obtain: function(key, callback){
		return this.send('obtain', [key], callback);
	},

	sync: function(action, callback){
		window.server.applyAction(action.name, action.args, callback);
	}
};

NS.Action = Object.prototype.extend({
	create: function(model, name, args){
		this.model = model;
		this.name = name;
		this.args = args || [];

		var parsedArgs = this.applyDefinition('parser');
		if( parsedArgs ) this.args = parsedArgs;
	},

	applyDefinition: function(definition){
		definition+= 's';
		if( !(definition in this.model.definitions) ) throw new Error('undefined definition' + definition);

		definition = this.model.definitions[definition][this.name];
		if( !definition ) return undefined;

		return definition.apply(this.model, this.args);
	},

	isCancelled: function(){
		return Boolean(this.applyDefinition('cancel'));
	},

	isValid: function(){
		var no = this.model.get('no' + this.name);

		if( no === true ) return false;
		// vérification externe (le noeud possède une propriété no[action] = function(){})
		if( typeof no == 'function' && no.apply(this.model, this.args) ) return false;

		// vérification interne
		if( this.applyDefinition('prevent') ) return false;

		return true;
	},

	exec: function(){
		this.model.emit('before:' + this.name, this);
		this.applyDefinition('method');
		this.model.emit(this.name, this);
	}
});

*/
