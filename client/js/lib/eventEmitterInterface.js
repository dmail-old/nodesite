NS.EventEmitterInterface = NS.EmitterInterface.extend({
	dispatchEvent: function(event){
		var target = this, parents = [], i, j = 0;

		while(target = target.parentNode) parents[j++] = target;	

		event.target = this;

		// capture phase, from the root to the target parent
		i = j;
		while(i--){
			if( !event.emit(parents[i]) ) return !event.defaultPrevented;
		}

		// emit on the target
		if( !event.emit(this) ) return !event.defaultPrevented;

		// bubble phase, from the target parent to the root
		if( event.bubbles ){
			i = 0;
			for(;i<j;i++){
				if( !event.emit(parents[i]) ) return !event.defaultPrevented;
			}
		}

		return !event.defaultPrevented;

		/*if( event.inherit ){
			event.target.crossNode(function(target){
				return !event.emit(target);
			});
		}*/
	},

	/*bubble: function(name){
		var event = NS.Event.new(name, true);

		event.args = toArray(arguments, 1);
		//event.arguments = [event].concat(event.args);

		return this.dispatchEvent(event);
	},*/

	/*
	inherit: function(name){
		var event = NS.Event.new(name, false);

		event.inherit = true;
		event.args = toArray(arguments, 1);
		
		return this.dispatchEvent(event);
	},
	*/

	emit: function(name){
		var event = NS.Event.new(name, false);

		event.args = toArray(arguments, 1);

		return this.dispatchEvent(event);
	}
});
