// Object.watch polyfill
Object.complement({
	watch: function(prop, handler){
		var oldval = this[prop], newval = oldval;

		function getter(){
			return newval;
		}

		function setter(val){
			oldval = newval;
			return newval = handler.call(this, prop, oldval, val);
		}

		if( delete this[prop] ){ // can't watch constants
			Object.defineProperty(this, prop, {
				get: getter,
				set: setter,
				enumerable: true,
				configurable: true
			});
		}
	},

	unwatch: function(prop){
		var val = this[prop];
		delete this[prop]; // remove accessors
		this[prop] = val;
	}
});
