/*

IMPORTANT:

Controllers exists only to change model in response to view events
Don't use it to act on view in response to view events
It would work but in that case the logic should belong to the view
(same goes for model)

*/

NS.Controller = {
	viewListener: null,
	viewListeners: null,
	modelListener: null,
	modelListeners: null,
	view: null,

	create: function(view){
		this.viewListener = NS.Listener.new(null, this.viewListeners, this);
		this.modelListener = NS.Listener.new(null, this.modelListeners, this);

		this.setView(view);
	},

	destroy: function(){
		this.unsetView();
		this.unsetModel();
	},

	setView: function(view){
		if( view && view != this.view ){
			this.view = view;
			this.viewListener.emitter = view;
			this.viewListener.listen();
			this.view.controllers[this.name] = this;

			if( this.view.model ) this.setModel(this.view.model);
		}
	},

	unsetView: function(){
		if( this.view ){
			if( this.view.model && this.model == this.view.model ) this.unsetModel();

			delete this.view.controllers[this.name];
			this.viewListener.stopListening();
			this.viewListener.emitter = null;
			this.view = null;
		}
	},

	setModel: function(model){
		if( model ){
			this.unsetModel();
			this.model = model;
			this.modelListener.emitter = model;
			this.modelListener.listen();
		}
	},

	unsetModel: function(){
		if( this.model ){
			this.modelListener.stopListening();
			this.modelListener.emitter = null;
			this.model = null;
		}
	}
};

NS.Controller.controllers = {};
NS.Controller.define = function(name, controller){
	controller.name = name;
	this.controllers[name] = this.extend(controller);
};

NS.View.control = function(name){
	var controller = NS.Controller.controllers[name];

	if( !controller ) console.log(name);

	name = this;
	return controller.new.apply(controller, arguments);
};

NS.View.relax = function(name){
	var controller = this.controllers[name];

	if( controller ) controller.destroy();
};
