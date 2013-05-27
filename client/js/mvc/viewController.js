/* global EventHandler */

var ViewController = new Class({
	Extends: EventHandler,

	initialize: function(view){
		EventHandler.prototype.initialize.call(this);

		this.view = view;
		Object.eachPair(this.handlers, function(name){ this.view.events[name] = this; }, this);
	}
});
