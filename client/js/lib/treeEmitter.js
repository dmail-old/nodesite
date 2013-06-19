NS.Event = {
	constructor: function(name, target, bubble){
		this.name = name;
		this.target = target;
		this.bubble = bubble;
	},

	stopPropagation: function(){
		this.stopped = true;
	},

	preventDefault: function(){
		this.defaultPrevented = true;
	},

	emit: function(target){
		this.currentTarget = target;
		target.emit(this.name, this);
		return !this.stopped;
	}
};

NS.TreeEmitter = NS.Emitter.extend({
	// emit event from the target to the target ancestors
	dispatchAncestor: function(event){
		var target = event.target;

		while( event.emit(target) ){
			target = target.parentNode;
			if( !target ) break;
		}

		return event;
	},

	// emit event from the target to the target descendant
	dispatchDescendant: function(event){

		event.target.crossNode(function(target){
			return !event.emit(target);
		}, null, true);

		return event;
	}
});

NS.TreeEmitterInterface = NS.EmitterInterface.extend({
	dispatchEvent: function(event){
		if( event.bubble ){
			this.emitter.dispatchAncestor(event);
		}
		else{
			this.emitter.dispatchAncestor(event);
		}
	},

	bubble: function(name, args){
		var event = NS.Event.new(name, this, true);
		event.args = args;

		return this.dispatchEvent(event);
	},

	capture: function(name, args){
		var event = NS.Event.new(name, this, false);
		event.args = args;

		return this.dispatchEvent(event);
	}
});
