NS.EventEmitter = NS.Emitter.extend({
	create: function(bind){
		this.bind = bind || this;
	},

	handleEvent: function(e){
		this.emit(e.type, e);
	},

	applyListener: function(listener, name, args){
		if( typeof listener == 'object' ){
			return listener.handleEvent(args[0]);
		}
		else{
			return listener.call(this.bind || this, args[0]);
		}
	}
});
