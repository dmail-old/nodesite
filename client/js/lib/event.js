NS.Event = {
	name: null,
	target: null,
	currentTarget: null,
	bubbles: false,
	//inherit: false,
	stopped: false,
	defaultPrevented: false,

	args: null,
	
	constructor: function(name, canBubble){
		this.name = name;
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

		target.emitter.emit(this.name, this);

		return !this.stopped;
	}
};
