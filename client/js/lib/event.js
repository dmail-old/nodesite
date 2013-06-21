NS.Event = {
	name: null,
	target: null,
	currentTarget: null,
	args: null,
	test: null,
	bubble: false,
	capture: false,
	stopped: false,
	defaultPrevented: false,

	constructor: function(name){
		this.name = name;
	},

	stopPropagation: function(){
		this.stopped = true;
	},

	preventDefault: function(){
		this.defaultPrevented = true;
	},

	emit: function(target){
		this.currentTarget = target;

		target.emitter.applyListeners(this.name, this.arguments);

		return !this.stopped;
	}
};
