NS.EventEmitter = NS.Emitter.extend({
	handleEvent: function(e){
		this.emit(e.type, e);
	},

	applyListener: function(listener, name, args){
		if( typeof listener == 'object' ){
			return listener.handleEvent(args[0]);
		}
		else{
			return listener.call(this.bind, args[0]);
		}
	}
});
