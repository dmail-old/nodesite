NS.EventEmitterInterface = NS.EmitterInterface.extend({
	dispatchEvent: function(event){
		var target = this, parents = [], j = 0;

		event.target = this;

		while(target = target.parentNode) parents[j++] = target;	

		// capture phase, from the root to the target
		while(j--){
			if( !event.emit(parents[j]) ) return !event.defaultPrevented;
		}

		// emit on the target
		if( !event.emit(this) ) return !event.defaultPrevented;

		// bubble phase, from the target to the root
		if( event.bubbles ){
			while(target = target.parentNode){
				if( !event.emit(target) ) return !event.defaultPrevented;
			}
		}

		return !event.defaultPrevented;

		/*if( event.inherit ){
			event.target.crossNode(function(target){
				return !event.emit(target);
			});
		}*/
	},

	bubble: function(name){
		var event = NS.Event.new(name, true);

		event.args = toArray(arguments, 1);
		//event.arguments = [event].concat(event.args);

		return this.dispatchEvent(event);
	},

	/*
	inherit: function(name){
		var event = NS.Event.new(name, false);

		event.inherit = true;
		event.args = toArray(arguments, 1);
		event.arguments = [event].concat(event.args);

		return this.dispatchEvent(event);
	},
	*/

	emit: function(name){
		var event = NS.Event.new(name, false);

		event.args = toArray(arguments, 1);
		//event.arguments = [event].concat(event.args);

		return this.dispatchEvent(event);
	}
});
