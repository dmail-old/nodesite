// ['  a','b',' c '].forEach(Function.prototype.call, String.prototype.trim) -> ['a','b','c']

Array.complement({
	applyEach: function(method, args){
		var i = 0, j = this.length, item;

		switch(typeof method){
		case 'string':
			for(;i<j;i++){
				item = this[i];
				item[method].apply(item, args);
			}
			break;
		case 'function':
			for(;i<j;i++){
				method.apply(this[i], args);
			}
			break;
		default:
			throw new TypeError(method + ' is not a function or a method name');
		}

		return this;
	},

	callEach: function(method){
		return Array.prototype.applyEach.call(this, method, toArray(arguments, 1));
	},

	mapApply: function(method, args){
		args = args || [];
		return Array.prototype.map.call(this, function(item){ return item[method].apply(item, args); });
	},

	mapCall: function(method){
		return Array.prototype.mapApply.call(this, method, toArray(arguments, 1));
	},

	max: function(){
		return Math.max.apply(Math, this);
	},

	min: function(){
		return Math.min.apply(Math, this);
	},

	contains: function(item, index){
		return this.indexOf(item, index) !== -1;
	},

	add: function(item, index){
		if( this.contains(item, index) ) return false;
		this.push(item);
		return true;
	},

	remove: function(item, index){
		index = this.indexOf(item, index);
		if( index === -1 ) return false;
		this.splice(index, 1);
		return true;
	},

	combine: function(array){
		// array.forEach(this.add, this);
		for(var i = 0, l = array.length; i < l; i++ ) this.add(array[i]);
		return this;
	},

	unique: function(){
		return [].combine(this);
	},

	replace: function(search, replace){
		var i = this.length;
		while(i--) if( this[i] === search ) this[i] = replace;
		return this;
	},

	item: function(key){
		return this[key];
	},

	// returns all this items not found in array in arguments
	diff: function(){
		var length = this.length, count = arguments.length, ret = [], i = 0, n = 0, array, j, k;

		loop: for(;i<length;i++){
			j = count;
			while(j--){
				array = arguments[j];
				k = array.length;
				while(k--) if( array[k] === this[i] ) continue loop;
				ret[n++] = this[i];
			}
		}

		return ret;
	},

	// add array at index position
	appendAt: function(index, array, removecount){
		this.splice.apply(this, [index || 0, removecount || 0].concat(array));
		return this;
	},

	copy: function(){
		return [].concat(this);
	},

	getLast: function(){
		return this[this.length-1];
	},

	/* return a value not existing in the array

	next: function(value, i) provide a function returning the next value to test
	exists: function(value) function testing if the value exists default to Array.prototype.contains

	ex: ['a','b'].getFree('a') -> 'a1'

	*/
	getFree: function(value, next, exists){
		if( typeof exists == 'undefined' ) exists = Array.prototype.contains;
		if( typeof next == 'undefined' ) next = function(value, i){ return value + i; };
		if( typeof next != 'function' || typeof exists != 'function' ) throw new TypeError('function expected');

		var i = 0, test = value;

		while( exists.call(this, test) ) test = next(value, i++);

		return test;
	}
});

// compat

Array.prototype.each = Array.prototype.forEach;
Array.prototype.call = Array.prototype.callEach;
Array.prototype.apply = Array.prototype.applyEach;
Array.prototype.invoke = Array.prototype.mapCall;

