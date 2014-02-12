
if( true || !window.WeakMap ){

	window.WeakMap = function(){
		this.keys = [];
		this.values = [];
	};

	window.WeakMap.prototype = {
		indexOf: function(key, index){
			if( typeof key != 'object' ){
				throw new TypeError("not a non-null object");
			}
			return this.keys.indexOf(key, index);
		},

		delete: function(key){
			var index = this.indexOf(key);

			if( index === -1 ){
				return false;
			}
			else{
				this.keys.splice(index, 1);
				this.values.splice(index, 1);
				return true;
			}
		},

		get: function(key, def){
			var index = this.indexOf(key);
			return index === -1 ? def : this.values[index];
		},

		has: function(key){
			return this.indexOf(key) !== -1;
		},

		set: function(key, value){
			var index = this.indexOf(key);

			if( index === - 1 ){
				this.values.push(value);
				this.keys.push(key);
			}
			else{
				this.values[index] = value;
			}
		},

		clear: function(){
			this.keys.legnth = this.values.length = 0;
		}
	};
}
