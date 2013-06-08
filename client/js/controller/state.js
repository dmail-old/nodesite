/* global */

Class.extend('controller', 'state', Class('controller').Node, {
	constructor: function(view, state, multiple){
		this.name = state;
		this.events = {};
		this.state = state;
		this.multiple = multiple;

		if( this.multiple ){
			this.list = [];
			this.name += 's';
		}

		this.events['view:addclass:' + state] = this.onaddstate;
		this.events['view:removeclass:' + state] = this.onremovestate;
		this.events['view:leave'] = this.events['view:removeclass:' + state];

		Class('controller').prototype.constructor.call(this, view);
	},

	onaddstate: function(view, e){
		//if( view.hasClass(this.state) ) return;

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
		// if( !view.hasClass(this.state) ) return;

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
		if( view ) view.addClass(this.state, e);
	},

	remove: function(view, e){
		if( view ) view.removeClass(this.state, e);
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

Object.eachPair(Class('view').states, function(name){
	Class('controller').providers[name] = function(view){
		return Class.new('controller.state', view, name);
	};
	Class('controller').providers[name + 's'] = function(view){
		return Class.new('controller.state', view, name, true);
	};
});
