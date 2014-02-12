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
NS.modelDocument.onremove = function(node, child){
	child.emit('emancipate');
};
