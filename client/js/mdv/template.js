/*

TODO:

- support nested template (with repeat attribute)
- support bind attribute
- support ref attribute on <template>
- support if attribute
- support checked and value attribute on input
- support for named scope: 'comment in user.comments' and 'foo as bar'

- support having method on model that can depend on property

as for Attribute binding we could have a sort of this.isMethod in PropertyObserver
in case it's a method it listen for method affectation
and also for property named in the arguments of the method then we could write

model.fullName = function(firstName, lastName){ return firstName + ' ' + lastName; };
<template>{fullName()}</template>

HELP:

https://github.com/Polymer/mdv/blob/master/src/template_element.js#L1194

templateiterator: il s'abonne aux modif sur IF, REPEAT et BIND

*/

var TemplateElements = {
	isTemplateNode: function(node){
		if( node.nodeType != 1 ) return false;
		return node.tagName == 'TEMPLATE' || node.hasAttribute('template');
	},

	checkNode: function(node, found){
		if( this.isTemplateNode(node) ){
			found.push(node);
		}
		else{
			return this.checkChildNodes(node, found);
		}
	},

	checkNodeList: function(nodeList, found){
		var i = 0, j = nodeList.length;
		for(;i<j;i++){
			this.checkNode(nodeList[i], found);
		}
		return found;
	},

	checkChildNodes: function(node, found){
		return this.checkNodeList(node.childNodes, found);
	},

	collect: function(element){
		return this.checkChildNodes(element, []);
	},

	createTemplateFromElementList: function(list){
		var i = 0, j = list.length;
		for(;i<j;i++){
			Template.new(list[i]);
		}
	},

	bootstrap: function(element){
		this.createTemplateFromElementList(this.collect(element));
	}
};

var Template = {
	element: null,
	content: null,
	linkers: null,
	hasSubTemplate: false,

	create: function(element){

		this.element = element;
		element.template = this;

		if( 'content' in element ){
			this.content = element.content;
		}
		else{
			this.content = element.ownerDocument.createDocumentFragment();
			while( element.firstChild ){
				this.content.appendChild(element.firstChild);
			}
		}

		var subtemplateElements = TemplateElements.collect(this.content);

		if( subtemplateElements.length !== 0 ){
			this.hasSubTemplate = true;
			TemplateElements.createTemplateFromElementList(subtemplateElements);
		}
	},

	bootstrap: function(element){
		TemplateElements.createTemplateFromElementList(TemplateElements.collect(element));
	},

	collectSubTemplate: function(){
		var content;

		if( 'content' in this.element ){
			content = this.content;
		}
		else{
			content = this.element;
		}

		return TemplateElements.collect(content);
	},

	parse: function(){
		if( this.linkers == null ){
			this.linkers = window.Parser.parse(this.content, true);
		}
		return this.linkers;
	},

	/*
	voir pourquoi on clone le template mais pas son contenu, c'est surement important

	<template repeat="users">
		<h2>User: {name}</h2>
		<ul>
			<template repeat="comment">
			<li>{text}</li>
			</template>
		</ul>
	</template>

	---->

	<template repeat="users">
		#documentFragment
	</template>
	<h2>User: damien</h2>
	<ul>
		<template repeat="comment">
			#documentFragment
		<template>
		<li>First comment</li>
		<li>Second comment</li>
	</ul>

	donc c'est logique de copier le template à chaque fois quon repète un user
	puisque le template sers de base pour savoir où insérer les commentaires

	en revanche polymer copie pas le content du coup ne copie pas #documentFragment
	pour repeat="comment"

	en fait y'a pas de raison de copier le template ou son contenu

	*/
	cloneWithoutTemplateContent: function(node){
		var clone = node.cloneNode(false), child;

		// ignore template
		if( !TemplateElements.isTemplateNode(clone) ){
			child = node.firstChild;
			while( child ){
				clone.appendChild(this.cloneWithoutTemplateContent(child));
				child = child.nextSibling;
			}
		}

		return clone;
	},

	cloneContent: function(){
		if( this.hasSubTemplate ){
			return this.cloneWithoutTemplateContent(this.content);
		}
		else{
			return this.content.cloneNode(true);
		}
	},

	createInstance: function(index, model){
		var instance = TemplateInstance.new(this);

		instance.setModel(model);
		this.instances[index] = instance;

		this.insertInstanceAt(index, instance);

		return instance;
	},

	getInsertBeforeNodeAt: function(index){
		var before;

		// firstNode of the nextInstance
		if( this.instances.length > index + 1 ){
			before = this.instances[index + 1].firstNode;
		}
		// lastNode.nextSibling of the previous instance
		else if( index > 0 ){
			before = this.instances[index - 1].lastNode.nextSibling;
		}
		// nextSibling of the template element
		else{
			before = this.element.nextSibling;
		}

		return before;
	},

	insertInstanceAt: function(index, instance){
		instance.insert(this.element.parentNode, this.getInsertBeforeNodeAt(index));
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

	setModel: function(model){
		this.unsetModel();

		this.model = model;
		this.instances = [];

		if( this.element.hasAttribute('repeat') ){

			var repeat = this.element.getAttribute('repeat');
			window.PathObserver.new(repeat, model, function(change){
				// on répète le template pour chaque item
				if( Array.isArray(change.value) ){

					window.ArrayObserver.new(change.value, function(change){
						if( change.type == 'add' ){
							this.createInstance(change.index, change.value);
						}
						else if( change.type == 'update' ){
							this.instances[change.index].destroy();
							this.createInstance(change.index, change.value);
						}
						else if( change.type == 'remove' ){
							this.instances[change.index].destroy();
							this.instances.splice(change.index, 1);
						}
						else if( change.type == 'affectations' ){
							this.performAffectations(change.value);
						}
					}, this);

				}
				else{
					// supression de toutes les instances
					this.instances.forEach(function(instance){
						instance.remove();
					});
					this.instances = null;
				}

			}.bind(this));

		}
		else{
			this.createInstance(0, model);
		}
	},

	unsetModel: function(){
		if( this.model ){
			this.instances.forEach(function(instance){
				instance.destroy();
			}, this);
			this.instances = [];
			this.model = null;
		}
	}
};

var TemplateInstance = {
	template: null,
	fragment: null,
	firstNode: null,
	lastNode: null,
	model: null,

	create: function(template){
		this.template = template;

		this.fragment = template.cloneContent();
		this.firstNode = this.fragment.firstChild;
		this.lastNode = this.fragment.lastChild;

		var first = this.firstNode, last = this.lastNode, node = this.firstNode;
		while( node ){
			node.templateInstance = this;
			if( node == last ) break;
			node = node.nextSibling;
		}
	},

	destroy: function(){
		this.unsetModel();
		this.remove();
	},

	getNodeAt: function(path){
		var node = this.firstNode, parts, i, j, part;

		if( path !== '' ){
			parts = path.split('.');
			i = 0;
			j = parts.length;

			for(;i<j;i++){
				// on utilise nextSibling (car au premier tour on connait pas node.parentNode.childNodes)
				part = parts[i++];
				while(part--){
					node = node.nextSibling;
					if( node == null ){
						return null;
					}
				}
				if( i < j ){
					node = node.firstChild;
					if( node == null ) break;
				}
			}
		}

		return node;
	},

	findNode: function(path){
		var node = this.getNodeAt(path);
		if( node == null ){
			console.log(this.firstNode, path);

			throw new Error('node not found');
		}
		return node;
	},

	link: function(model){
		var linkers = this.template.parse(), i = linkers.length, linker;

		while(i--){
			linker = linkers[i];
			linker.link(this.findNode(linker.path), model);
		}
	},

	unlink: function(model){
		var linkers = this.template.parse(), i = linkers.length, linker;

		while(i--){
			linker = linkers[i];
			linker.unlink(this.findNode(linker.path), model);
		}
	},

	setModel: function(model){
		this.model = model;
		this.link(model);
	},

	// lorsque je fais unsetModel les listeners sur ce modèle doivents disparaitre
	// tous les noeuds écoutant doivent donc être supprimé
	unsetModel: function(model){
		this.unlink(model);
		this.model = null;
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
		if( this.firstNode.parentNode == this.fragment ) return;

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
