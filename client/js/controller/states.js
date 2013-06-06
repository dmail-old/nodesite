/* global Controller, View */

Controller.extends('states', {
	Implements: Controller.Node,
	states: [],

	constructor: function(view, states){
		this.events = {};

		states.forEach(function(state){
			var on = View.states[state][0], off = View.states[state][1];

			this.events['view:' + on] = function(view, e){
				var previous = this[state];

				this.setCurrent(state, view);
				if( previous ) previous[off](e);
			};
			this.events['view:' + off] = function(view, e){
				if( view == this[state] ) this.unsetCurrent(state);
			};

			this.events['view:leave'] = this.events['view:' + off];

		}, this);

		Controller.prototype.constructor.call(this, view);
	},

	setCurrent: function(state, view){
		this[state] = view;
	},

	unsetCurrent: function(state){
		delete this[state];
	}
});
