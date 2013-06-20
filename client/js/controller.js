/*

mouseover se produit sur le document
je veux lighted la vue sur laquelle se produit le mouseover

pour cela je récup la vue sur laquelle mouseover se produit
-> ok c bon avec data-view sur les éléments

je dois maintenant savoir si la vue implémente ce controlleur particulier
-> ok avec un test sur view.controller.mouseoverlight == true

je dois maintenant stocker lighted pour ce groupe de vue spécifique
-> view.root.lighted = true;

view doit disposer d'une propriété root sauf que view.root à maintenir c chiant
sinon le controlleur doit être spécifique à cette vue

je crée un groupe de controlleur pour cette vue
ensuite je définit des controlleurs pour ce groupe

RootController = new RootController(rootView);
RootController.add('lighted');
RootController.add('mouseoverLighted');

la propriété root c'est ownerDocument pour element

en fait ce qu'on fait là c'est une espèce de controllerDocument.createController();
dailleurs pour view et model pareil
sauf que on a plusieurs document dans un même document

*/

NS.Controller = {
	viewListeners: null,
	modelListeners: null,

	constructor: function(view){
		this.viewListener = NS.Listener.new(null, this.viewListeners, this);
		this.modelListener = NS.Listener.new(null, this.modelListeners, this);

		this.setView(view);
	},

	destructor: function(){
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
		if( model && model != this.model ){
			this.model = model;
			this.modelListener.emitter = model;
			this.modelListener.listen();
		}
	},

	unsetModel: function(){
		if( this.element ){
			this.eventListener.stopListening();
			this.eventListener.emitter = null;
			this.element = null;
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
