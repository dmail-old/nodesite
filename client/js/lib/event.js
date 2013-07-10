NS.Event = {
	type: null,
	target: null,
	currentTarget: null,
	bubbles: false,
	stopped: false,
	defaultPrevented: false,
	args: null,

	create: function(type, canBubble){
		this.type = type;
		this.bubbles = Boolean(canBubble);
	},

	stopPropagation: function(){
		this.stopped = true;
	},

	preventDefault: function(){
		this.defaultPrevented = true;
	},

	emit: function(target){
		this.currentTarget = target;

		target.emitter.emit(this.type, this);

		return !this.stopped;
	}
};
