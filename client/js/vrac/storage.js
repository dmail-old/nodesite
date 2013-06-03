var Item = new Class({
	constructor: function(){
		this.clear();
	},

	clear: function(){
		this.pairs = {};
		this.length = 0;
		return this;
	},

	contains: function(name){
		return name in this.pairs;
	},

	get: function(name){
		return this.pairs[name];
	},

	set: function(name, value){
		this.pairs[name] = value;
		this.length++;
		return this;
	},

	remove: function(name){
		delete this.pairs[name];
		this.length--;
	}
});

var Storage = new Class({
	Extends: Item,

	onset: function(){
		this.length++;
	},

	onremove: function(){
		this.length--;
	},

	onclear: function(){
		this.length = 0;
	}
});

Storage.prototype.has = Storage.prototype.contains;
Storage.prototype.reset = Storage.prototype.clear;