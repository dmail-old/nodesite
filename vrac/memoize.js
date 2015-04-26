/*
var i = arguments.length, hash = '', arg;
  
  while(i--){
    arg = arguments[i];
    hash+= arg === Object(arg) ? JSON.stringify(arg) : arg;
  }
  
  return hash;

  mais ça va pas paske 'a', 'b', '' == 'ab', '', ''

*/

var proto = require('@dmail/proto');

var ObjectCache = proto.create({
	object: null,
	value: undefined,
	exists: null,

	has: function(){
		return this.exists === true;
	},

	get: function(){
		return this.value;
	},

	set: function(value){
		this.exists = true;
		this.value = value;
	},

	delete: function(){
		this.exists = false;
		this.value = undefined;
	},

	clear: function(){
		this.delete();
	}
});

var Cache = proto.create({
	cachedObject: null,
	objects: null,
	values: null,
	index: null,

	init: function(object){
		this.cachedObject = object;
		this.objects = [];
		this.values = [];
	},

	hasOwn: function(object){
		var index = this.objects.indexOf(object);
		this.index = index;
		return index !== -1;
	},

	has: function(object){

		while( this.hasOwn(object) === false ){
			object = Object.getPrototypeOf(object);
			if( object === this.cachedObject ) break;
			if( object === null ){
				throw new Error('object not child of cachedObject');
			}
		}

		return this.index != -1;
	},

	get: function(object, has){
		if( has === true || this.has(object) ) return this.values[this.index];
		return null;
	},

	set: function(object, value){
		if( this.has(object) ){
			this.values[this.index] = value;
		}
		else{
			this.objects.push(object);
			this.values.push(value);
		}
	},

	delete: function(object){
		if( this.hasOwn(object) ){ // delete own cache, never parent cache, like delete operator on property
			this.objects.splice(this.index, 1);
			this.values.splice(this.index, 1);
			return true;
		}
		return false;
	},

	clear: function(){
		this.objects.length = this.values.length = 0;
	}
});

function memoize(fn, options){
	var cache = Cache.new();

	function cached(){
		var value;

		if( cache.has(this, arguments) ){
			value = cache.get(this, arguments, true);
		}
		else{
			value = fn.apply(this, arguments);
			cache.set(this, value);
		}

		return value;
	}

	cached.cache = cache;
	return cached;
}

module.exports = memoize;

