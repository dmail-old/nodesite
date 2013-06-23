NS.EmitterInterface = {
	on: function(){
		return this.emitter.on.apply(this.emitter, arguments);
	},

	off: function(){
		return this.emitter.off.apply(this.emitter, arguments);
	},

	once: function(){
		return this.emitter.once.apply(this.emitter, arguments);
	},

	emit: function(){
		return this.emitter.emit.apply(this.emitter, arguments);
	}
};