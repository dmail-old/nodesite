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

		this.viewListeners[NS.viewstate.states[state][0]] = function(e){
			if( e.target == this ){
				this.remove(this.current, e.args[0]);
			}
			else{
				this.add(e.target, e.args[0]);
			}
		};
		this.viewListeners[NS.viewstate.states[state][1]] = function(e){
			this.remove(this.current, e.args[0]);
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
	},

	add: function(view, e){
		if( view && !view.hasClass(this.state) ){
			view.addClass(this.state);
			this.onaddstate(view, e);
		}
	},

	remove: function(view, e){
		if( view && view.hasClass(this.state) ){
			view.removeClass(this.state);
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
