window.ObjectChangeEmitter = (function(Emitter){

	var ObjectChangeEmitter = Emitter.extend({
		modelInstance: new WeakMap(),

		new: function(model){
			var instance = this.modelInstance.get(model);

			if( !instance ){
				instance = Emitter.new.call(this, model);
				this.modelInstance.set(model, instance);
			}

			return instance;
		},

		watcher: function(name, oldValue, value){
			if( oldValue != value ){
				this.emit(name, name, oldValue, value);
			}
			return value;
		},

		onaddfirstlistener: function(name){
			Object.prototype.watch.call(this.bind, name, this.watcher.bind(this));
		},

		onremovelastlistener: function(name){
			Object.prototype.unwatch.call(this.bind, name);
			if( Object.isEmpty(this.$listeners) ){
				this.modelInstance.delete(this.bind);
			}
		}
	});

	return ObjectChangeEmitter;

})(NS.Emitter);
