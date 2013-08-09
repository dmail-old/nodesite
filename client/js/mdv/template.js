/*

https://github.com/Polymer/ObserveJS/tree/master

name: template

description: mainly inspired from polymer:

https://github.com/Polymer/mdv/blob/master/src/template_element.js#L1194

TODO:

- support for named scope: 'comment in user.comments' and 'foo as bar'
http://www.polymer-project.org/platform/mdv/expression_syntax.html#named-scopes

- support if attribute
- support ref attribute

MORE:

- support having method on model that can depend on property

as for AttributBinding with conditional we could have a sort of
isMethod in PropertyObserver
in case it's a method it listen for method affectation
and also for property named in the arguments of the method then we could write

model.fullName = function(firstName, lastName){ return firstName + ' ' + lastName; };
<template>{fullName()}</template>

- support checked and value attribute on input

*/

var Template = {
	element: null,
	content: null,
	linkers: null,
	hasSubTemplate: false,
	templateIterator: null,
	toString: function(){ return 'Template'; },

	create: function(element){
		window.HTMLTemplateElement.decorate(element);

		this.element = element;
		element.template = this;
		this.content = element.content;
	},

	parse: function(){
		if( this.linkers == null ){
			this.linkers = window.Parser.parse(this.content, true);
		}
		return this.linkers;
	},

	cloneContent: function(){
		return this.content.cloneNode(true);
	},

	createInstance: function(model){
		var instance = TemplateInstance.new(this);
		instance.setModel(model);
		return instance;
	},

	setModel: function(model){
		this.unsetModel();
		this.model = model;
		this.templateIterator = TemplateIterator.new(this);
	},

	unsetModel: function(){
		if( this.model ){
			if( this.templateIterator ){
				this.templateIterator.close();
				this.templateIterator = null;
			}
			this.model = null;
		}
	}
};

Object.defineProperty(Node.prototype, 'templateInstance', {
	get: function(){
		var instance = TemplateInstance.map.get(this);

		if( instance ) return instance;
		if( this.parentNode ) return this.parentNode.templateInstance;
		return undefined;
	}
});

Node.prototype.getNodeAt = function(){
	var node = this, i = 0, j = arguments.length, arg;

	for(;i<j;i++){
		arg = Number(arguments[i]);
		// on utilise nextSibling (car au premier tour on connait pas node.parentNode.childNodes)
		while( arg-- ){
			node = node.nextSibling;
			if( node == null ) return null;
		}

		if( i + 1 < j ){
			node = node.firstChild;
			if( node == null ) return null;
		}
	}

	return node;
};

Node.prototype.getNodeAtPath = function(path){
	return this.getNodeAt.apply(this, path.split('.'));
};

var TemplateInstance = {
	template: null,
	fragment: null,
	firstNode: null,
	lastNode: null,
	model: null,
	map: new WeakMap(),
	toString: function(){ return 'TemplateInstance'; },

	create: function(template){
		this.template = template;
		this.fragment = template.cloneContent();
		this.firstNode = this.fragment.firstChild;
		this.lastNode = this.fragment.lastChild;
		this.linkFragment(this.fragment);
	},

	toggleFragmentMap: function(fragment, link){
		var node = fragment.firstChild;

		while( node ){
			if( link ){
				this.map.set(node, this);
			}
			else{
				this.map.delete(node);
			}
			node = node.nextSibling;
		}
	},

	linkFragment: function(fragment){
		return this.toggleFragmentMap(fragment, true);
	},

	unlinkFragment: function(fragment){
		return this.toggleFragmentMap(fragment, false);
	},

	destroy: function(){
		this.unsetModel();
		this.remove();
		this.unlinkFragment(this.fragment);
	},

	getNodeAtPath: function(path){
		return this.firstNode ? this.firstNode.getNodeAtPath(path) : null;
	},

	findNode: function(path){
		var node = this.getNodeAtPath(path);
		if( node == null ){
			console.warn('node not found at', path, 'in', this.firstNode, this);
		}
		return node;
	},

	link: function(model){
		var linkers = this.template.parse(), i = linkers.length, linker, node;

		while(i--){
			linker = linkers[i];
			node = this.findNode(linker.path);
			if( node ) linker.link(node, model);
		}
	},

	unlink: function(model){
		var linkers = this.template.parse(), i = linkers.length, linker, node;

		while(i--){
			linker = linkers[i];
			node = this.findNode(linker.path);
			if( node ) linker.unlink(node, model);
		}
	},

	setModel: function(model){
		this.unsetModel();
		this.model = model;
		this.link(model);
	},

	unsetModel: function(model){
		if( this.model != null ){
			this.unlink(model);
			this.model = null;
		}
	},

	insert: function(parent, before){
		this.remove();

		if( !before ){
			parent.appendChild(this.fragment);
		}
		else{
			parent.insertBefore(this.fragment, before);
		}
	},

	remove: function(){
		// not inserted
		if( !this.firstNode || this.firstNode.parentNode == this.fragment ) return;

		var first = this.firstNode, last = this.lastNode, node = this.firstNode, next;

		// put back the node in the fragment
		// -> if insert is called after remove fragment is still filled with the nodeList
		while( node ){
			next = node.nextSibling;
			this.fragment.appendChild(node);
			if( node == last ) break;
			node = next;
		}
	}
};

var TemplateIterator = {
	template: null,
	element: null,
	instances: null,
	observer: null,
	arrayObserver: null,
	closed: false,
	toString: function(){ return 'TemplateIterator'; },

	create: function(template){
		this.template = template;
		this.element = template.element;
		this.instances = [];

		this.checkAttributes();
	},

	getInsertBeforeNodeAt: function(index){
		var before;

		// use firstNode of the nextInstance
		if( this.instances.length > index + 1 ){
			before = this.instances[index + 1].firstNode;
		}
		// use lastNode.nextSibling of the previous instance
		else if( index > 0 ){
			before = this.instances[index - 1].lastNode.nextSibling;
		}
		// use nextSibling of the template element
		else{
			before = this.element.nextSibling;
		}

		return before;
	},

	insertInstanceAt: function(index, model){
		var instance = this.template.createInstance(model);
		this.instances[index] = instance;
		instance.insert(this.element.parentNode, this.getInsertBeforeNodeAt(index));
		return instance;
	},

	/*
	When calling sort or reverse on model, i get a list of affectations
	[oldIndex, newIndex, ...]
	The list is used to sync model and this.instances

	As instance represent DOM nodes I have to move DOM nodes accordingly
	for more information look at transformAffectationsToMoves
	*/
	performAffectations: function(affectations){
		var i, j, oldIndex, index, instance, currentInstance, instances = this.instances;
		var moves = window.ArrayObserver.transformAffectationsToMoves(affectations);

		i = 0;
		j = moves.length;
		for(;i<j;i+=2){
			oldIndex = moves[i];
			index = moves[i + 1];
			instance = instances[oldIndex];
			currentInstance = instances[index];

			/*
			move is a costfull operation (two splice) but it's the only way i've found
			to make DOM follow the instances array state

			the reason is that array.splice and DOM insertion works the same:
			the element is removed from it's place then inserted to his new location
			*/
			instances.move(oldIndex, index);
			instance.insert(this.element.parentNode, currentInstance.firstNode);
		}
	},

	arrayChanged: function(change){
		if( change.type == 'add' ){
			this.insertInstanceAt(change.index, change.value);
		}
		else if( change.type == 'update' ){
			this.instances[change.index].destroy();
			this.insertInstanceAt(change.index, change.value);
		}
		else if( change.type == 'remove' ){
			this.instances[change.index].destroy();
			this.instances.splice(change.index, 1);
		}
		else if( change.type == 'affectations' ){
			this.performAffectations(change.value);
		}
	},

	observe: function(array){
		this.unobserve();
		this.arrayObserver = window.ArrayObserver.new(array, this.arrayChanged, this);
	},

	unobserve: function(){
		if( this.arrayObserver ){
			this.arrayObserver.close();
			this.arrayObserver = null;
		}
	},

	destroyInstances: function(){
		var instances = this.instances, i = 0, j = instances.length;
		for(;i<j;i++){
			instances[i].destroy();
		}
		this.instances.length = 0;
	},

	valueChanged: function(change){
		// on répète le template pour chaque item
		if( Array.isArray(change.value) ){
			this.observe(change.value);
		}
		// supression de toutes les instances
		else{
			this.unobserve();
			this.destroyInstances();
		}
	},

	bindChanged: function(change){
		this.instances[0].setModel(change.value);
	},

	checkAttributes: function(){
		var model = this.template.model;

		/*
		polymer: Templateiterator écoute les propriétés bind, if et repeat
		de cette manière il construit les itérations en fonctions des valeurs
		de ces trois propriété et pas que de repeat
		https://github.com/Polymer/mdv/blob/master/src/template_element.js#L1224
		*/

		// repeat
		if( this.element.hasAttribute('repeat') ){
			var repeat = this.element.getAttribute('repeat');
			this.observer = window.PathObserver.new(repeat, model, this.valueChanged, this);
		}
		// bind
		else{
			var bind = this.element.getAttribute('bind');

			// on observe une sous partie du modèle
			if( bind ){
				this.insertInstanceAt(0);
				this.observer = window.PathObserver.new(bind, model, this.bindChanged, this);
			}
			// on observe le modèle
			else{
				this.insertInstanceAt(0, model);
			}
		}
	},

	close: function(){
		if( this.closed === false ){
			this.unobserve();
			this.destroyInstances();
			this.observer.close();
			this.observer = null;
			this.closed = true;
		}
	}
};
