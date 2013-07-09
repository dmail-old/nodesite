NS.ElementEmitter = NS.EventEmitter.extend({
	create: function(element, bind){
		NS.EventEmitter.create.call(this, bind || element);
		this.element = element;
	},

	handleEvent: function(e){
		this.emit(e.type, e);
	},

	onaddlistener: function(name, listener){
		this.element.addEventListener(name, this);
	},

	onremovelistener: function(name, listener){
		this.element.removeEventListener(name, this);
	}
});
