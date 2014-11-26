var proto = require('proto');

var Item = proto.create({
	object: null,
	proto: null,
	descriptors: null,
	item: null,

	init: function(object){
		this.object = object;
		this.descriptors = {};
	},

	getPrototype: function(){
		return this.proto;
	},

	setPrototype: function(proto){
		this.proto = proto;
	},

	hasOwnProperty: function(name){
		return Object.prototype.hasOwnProperty.call(this.object, name);
	},

	// key in
	has: function(name){
		var item = this;

		do{
			if( item.hasOwnProperty(name) ){
				this.item = item;
				return true;
			}
		}
		while(item = item.getPrototype());

		return false;
	},

	getDescriptor: function(name){
		if( this.has(name) ){
			return this.item.descriptors[name];
		}
		return null;
	},

	getOwnPropertyDescriptor: function(name){
		if( this.hasOwnProperty(name) ){
			return this.descriptors[name];
		}
		return null;
	},

	defineProperty: function(name, descriptor){
		var currentDescriptor = this.getOwnPropertyDescriptor(name);

		if( currentDescriptor && currentDescriptor.configurable === false ){
			throw new Error('non configurable property');
		}

		this.descriptors[name] = descriptor;
	},

	get: function(name, has){
		if( has || this.has(name) ){
			var descriptor = this.item.descriptors[name];

			if( 'value' in descriptor ) return descriptor.value;
			if( 'get' in descriptor ) return descriptor.get.call(this.item);
			// on arrive jamais ici
		}

		return undefined;
	},

	set: function(name, value){
		var descriptor = this.getOwnPropertyDescriptor(name);

		if( descriptor == null ){
			descriptor = {
				writable: true,
				configurable: true,
				enumerable: true,
				value: undefined
			};

			this.descriptors[name] = descriptor;
		}
		else if( descriptor.writable === false ){
			throw new Error('non writable value');
		}

		if( 'value' in descriptor ) descriptor.value = value;
		if( 'set' in descriptor ) descriptor.set.call(this.item, value);
	},

	delete: function(name){
		if( this.hasOwnProperty(name) ){
			delete this.descriptors[name];
			delete this.object[name];
		}
	}
});