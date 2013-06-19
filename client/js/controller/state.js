NS.StateController = NS.Controller.extend({
	constructor: function(view, state, multiple){
		this.name = state;
		this.viewListeners = {};
		this.state = state;
		this.multiple = multiple;

		if( this.multiple ){
			this.list = [];
			this.name += 's';
		}

		this.viewListeners[NS.viewstate.states[state][0]] = function(view, e){
			this.add(view, e);
		};
		this.viewListeners[NS.viewstate.states[state][1]] = function(e){
			this.remove(this.current, e);
		};
		this.viewListeners['destroy'] = function(e){
			this.onremovestate(e.target);
		};

		NS.Controller.constructor.call(this, view);
	},

	onaddstate: function(view, e){
		if( this.multiple ){
			this.removeCurrent(e);
			this.set(view);
		}
		else{
			var prev = this.get();
			this.current = view;
			this.remove(prev, e);
			this.set(view);
		}

		this.emit('add:state:' + this.state, e);
	},

	onremovestate: function(view, e){
		if( this.multiple ){
			this.unset(view);
		}
		else{
			if( view == this.get() ){
				this.unset(view);
			}
		}

		this.emit('remove:state:' + this.state, e);
	},

	add: function(view, e){
		if( view && !view.hasClass(this.state) ){
			view.addClass(this.state, e);
			this.onaddstate(view, e);
		}
	},

	remove: function(view, e){
		if( view && view.hasClass(this.state) ){
			view.removeClass(this.state, e);
			this.onremovestate(view, e);
		}
	},

	removeCurrent: function(e){
		if( this.multiple ){
			// NOTE: need to loop that way because the selecteds array is spliced during the loop
			var list = this.get(), i = list.length;
			while(i--) this.remove(list[0], e);
		}
		else{
			this.remove(this.get(), e);
		}
	},

	get: function(){
		if( this.multiple ){
			return this.list;
		}
		else{
			return this.current;
		}
	},

	set: function(view){
		if( this.multiple ){
			this.list.push(view);
		}
		else{
			this.current = view;
		}
	},

	unset: function(view){
		if( this.multiple ){
			this.list.remove(view);
		}
		else{
			delete this.current;
		}
	}
});
