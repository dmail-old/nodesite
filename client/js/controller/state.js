/* global Controller, View */

Controller.extends('state', {
	Implements: Controller.Node,

	constructor: function(view, state, multiple){
		this.events = {};
		this.state = state;
		this.multiple = multiple;

		if( this.multiple ){
			this.view[this.state + 's'] = [];
		}

		var on = View.states[state][0], off = View.states[state][1];

		this.events['view:' + on] = this.onaddstate;
		this.events['view:' + off] = this.onremovestate;
		this.events['view:leave'] = this.events['view:' + off];

		Controller.prototype.constructor.call(this, view);
	},

	onaddstate: function(view, e){
		var off = View.states[this.state][1], previous;

		if( this.multiple ){
			previous = [].concat(this.get());

			this.set(view);
			previous.forEach(function(current){ if( current != view ) current[off](e); }, this);
		}
		else{
			previous = this.get();

			this.set(view);
			if( previous ) previous[off](e);
		}
	},

	onremovestate: function(view, e){
		if( this.multiple || view == this.get() ){
			this.unset(view);
		}
	},

	get: function(){
		if( this.multiple ){
			return this.view[this.state + 's'];
		}
		else{
			return this.view[this.state];
		}
	},

	set: function(view){
		if( this.multiple ){
			this.view[this.state + 's'].push(view);
		}
		else{
			this.view[this.state] = view;
		}
	},

	unset: function(view){
		if( this.multiple ){
			this.view[this.state + 's'].remove(view);
		}
		else{
			delete this.view[this.state];
		}		
	}
});
