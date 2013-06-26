NS.Model = {
	cid: 0,
	emitter: null,
	properties: null,
	name: '',

	validationError: null,

	constructor: function(properties){
		this.emitter = NS.Emitter.new(this);
		this.properties = properties ? this.parse(properties) : {};
		this.cid = this.cid++;

		if( this.has('name') ) this.name = this.get('name');
		if( this.has('childNodes') ) this.childNodes = this.get('childNodes');
	},

	parse: function(properties){
		return properties;
	},

	encode: function(key, value){
		return value;
	},

	valid: function(key, value){
		this.validationError = this.validate(key, value) || null;
		return !this.validationError;
	},

	validate: Function.EMPTY,

	compare: function(key, a, b){
		return a === b;
	},

	has: function(key){
		return key in this.properties;
	},

	get: function(key){
		return this.properties[key];
	},

	change: function(key, value, current){
		this.emit('change', key, value, current);
		this.emit('change:' + key, value, current);
	},

	set: function(key, value){
		var current;

		value = this.encode(key, value);

		if( !this.valid(key, value) ){
			this.emit('invalid', key, value, this.validationError);
		}
		else{
			current = this.get(key);
			if( !this.compare(key, current, value) ){
				this.properties[key] = value;
				this.change(key, value, current);
			}
		}

		return this;
	},

	unset: function(key){
		var current;

		if( this.has(name) ){
			current = this.get(name);
			delete this.properties[name];
			this.change(key, undefined, current);
		}

		return this;
	}
}.supplement(
	NS.EventEmitterInterface,
	NS.NodeInterface,
	NS.NodeFinder,
	{
		oninsertchild: function(child){
			this.emit('adopt', child, this.childNodes.indexOf(child));
		},

		onremovechild: function(child){
			child.emit('emancipate');
		}
	}
);

NS.modelDocument = NS.Document.new(NS.Model);

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
	constructor: function(model, name, args){
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
