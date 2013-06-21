NS.EventEmitter = NS.Emitter.extend({
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
		}, this, true);

		return event;
	}
});

NS.EventEmitterInterface = NS.EmitterInterface.extend({
	dispatchEvent: function(event){
		if( event.bubble ){
			this.emitter.dispatchAncestor(event);
		}
		else if( event.capture ){
			this.emitter.dispatchDescendant(event);
		}
		else{
			event.emit(event.target);
		}
	},

	bubble: function(name){
		var event = NS.Event.new(name);

		event.target = this;
		event.bubble = true;
		event.args = toArray(arguments, 1);
		event.arguments = [event].concat(event.args);

		return this.dispatchEvent(event);
	},

	capture: function(name){
		var event = NS.Event.new(name);

		event.target = this;
		event.capture = true;
		event.args = toArray(arguments, 1);
		event.arguments = [event].concat(event.args);

		return this.dispatchEvent(event);
	},

	emit: function(name){
		var event = NS.Event.new(name);

		event.target = this;
		event.args = toArray(arguments, 1);
		event.arguments = [event].concat(event.args);

		return this.dispatchEvent(event);
	}
});
