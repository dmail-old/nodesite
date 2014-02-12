var NS = new Class({
	constructor: function(){
		this.clear();
	},

	clear: function(){
		this.pairs = {};
		return this;
	},

	contains: function(key){
		return key in this.pairs;
	},

	get: function(key){
		return this.pairs[key];
	},

	set: function(key, value){
		this.pairs[key] = value;
		return value;
	},

	remove: function(key){
		delete this.pairs[key];
	}
});

var Storage = new Class({
	Extends: NS,

	onset: function(){
		this.length++;
	},

	onremove: function(){
		this.length--;
	},

	onclear: function(){
		this.length = 0;
	},

	forEach: function(fn, bind){
		Object.eachPair(this.pairs, fn, bind);
		return this;
	},

	clear: function(){
		this.forEach(this.remove, this);
		this.onclear();
		return NS.prototype.clear.call(this);
	},

	set: function(key, value){
		this.remove(key);
		this.onset(key, value);
		return NS.prototype.set.call(this, key, value);
	},

	remove: function(key){
		if( this.contains(key) ){
			this.onremove(key, this.get(key));
			NS.prototype.remove.call(this, key);
			return true;
		}
		return false;
	}
});

Storage.prototype.has = Storage.prototype.contains;
Storage.prototype.reset = Storage.prototype.clear;
