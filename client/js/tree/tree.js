/*
---

name: Tree

description: Base pour la structure d'arbre

NOTE
- ownerTree, comme ownerDocument qui pourrait renvoyer l'abre possédant le noeud, ownerTree serait modifier par importNode
- clone: actuellement clone se content de cloner les propriétés et jamais l'apparence, ça peut être trompeur mais c'est ce qu'il faut seul les propriétés comptent
- échap sur un noeud en cours de chargement de lecture, etc -> annulation de l'action si possible

MORE
- mode explorateur de fichier avec dossier à gauche fichiers à droite
pour les fichiers image l'icône devras être centrer pour ne pas étirer l'image et l'empêcher de dépasser 16x16 ou 32x32 ou 64x64...
- (supporté que sous firefox donc on oublie) setDragimage de treedraw, au lieu d'un canvas un element en position absolute left-2000 c'est parfait, on le stylise en CSS en plus
- unique options caseInsensitive (voir finder.js pour y ajouter une option de sensibilité à la casse)
-> signifie que si on renommer un noeud "nAmE" et que "name" existe il y a conflit
- download (sur fichier, ce qui fait download as zip sur dossier), zip et unzip (sur dossier)

- on pourrait très bien imaginer ceci: et treenode et tree hériterais de collectionnode et collection
var Collectionnode = new Class();
var Collection = new Class();
dans backbone c'est ce qu'il font
tree serait un collection particulier
Treenode aussi serait un collection particulier non??

dans ce fonctionnement Treenode est indépendant de Tree jusqu'à ce qu'on l'ajoute manuellement
Treenode peut exister sans être lié à Tree

TODO

- les schemas doivent avoir une méthode validate retourner false et garde trace de l'erruer lorsque la valeur ne match pas
- dropfile je redéfinit insert handler mais j'en ai toujours besoin pour tree.unique
- j'annule la supression d'un noeud il revient selected -> normal, à gérer

- multiSelection qui est un plugin
- enter et leave, comment gère-t-on les états?

FIX

- la popup lorsqu'elle affiche un texte plus grand que la fenêtre elle considère que sa taille minimum correspond au texte
et du coup on se retrouve avec une popup énorme

...
*/

(function(){

var Treenode = this.Treenode = new Class({
	//Extends: Emitter,
	
	initialize: function(tree, properties){
		this.tree = tree;
		this.properties = this.parseProperties(properties);
		this.proto = this.calcProto();
	},
	
	parseProperties: function(properties){
		if( !properties.name ) properties.name = '';
		if( !properties.children ) properties.children = [];
		else properties.children = this.parseChildren(properties.children);
		
		this.name = properties.name;
		this.children = properties.children;
		
		return properties;
	},
	
	calcProto: function(){
		var proto = {}, type = this.getProperty('type');
			
		this.type = type;
		if( type ) Object.append(proto, this.tree.getTypeProperties(type));
			
		return proto;
	},
	
	propertyChange: function(name, value, current){
		this.tree.propertyChange(this, name, value, current);
	},
	
	compare: function(name, a, b){
		return a === b;
	},
	
	hasProperty: function(name){
		return name in this.properties;
	},
	
	getProperty: function(name){
		return this.hasProperty(name) ? this.properties[name] : undefined;
	},
	
	setProperty: function(name, value){
		var current = this.get(name);
		
		if( !this.compare(name, value, current) ){
			this.properties[name] = value;
			this.propertyChange(name, value, current);
		}
		
		return this;
	},	
	
	removeProperty: function(name){
		var current;
		
		if( this.has(name) ){
			current = this.getProperty(name);
			delete this.properties[name];
			this.propertyChange(name, undefined, current);
		}
		
		return this;
	},
	
	hasProto: function(name){
		return name in this.proto;
	},
	
	getProto: function(name){
		return name in this.proto ? this.proto[name] : undefined;
	},
				
	setProto: function(name, value){
		var current = this.getProto(name);
		
		if( !this.compare(name, value, current) ){
			this.proto[name] = value;
			if( !this.hasProperty(name) ) this.propertyChange(name, value, current, true);
		}
		
		return this;
	},
	
	removeProto: function(name){
		var current, value;
	
		if( name in this.proto ){
			current = this.getProto(name);
			delete this.proto[name];
			if( !this.hasProperty(name) ) this.propertyChange(name, value, current, true);
		}
		
		return this;
	},
	
	has: function(name){
		return this.hasProperty(name) || this.hasProto(name);
	},
	
	get: function(name){
		return this.hasProperty(name) ? this.getProperty(name) : this.getProto(name);
	},	
	
	// met à jour le proto lorsque une propriété l'influencant a été modifiée
	updateProto: function(){
		var proto = this.calcProto();
		
		// remove tout ce qui n'est pas dans le proto qu'on calcule
		Object.eachPair(this.proto, function(name){ if( !(name in proto) ) this.removeProto(name); }, this);
		// met à jour tout ce qui est dans le proto qu'on vient de calculer		
		Object.eachPair(proto, this.setProto, this);
		
		return this;
	},
	
	clone: function(append){
		var clone = this.tree.createNode(this.toClone(append));
		
		this.emit('clone', clone);
		
		return clone;
	},
	
	toClone: function(append){
		var clone = Object.clone(this.properties);
		
		if( append === false ) delete clone.children;
		else if( append ) Object.append(clone, append);
		
		return clone;
	},
	
	toJSON: function(){
		return this.properties;
	},
	
	toString: function(){
		return this.name;
	}
});

/*
Treenode.prototype.on('applyListeners', function(){
	var name = arguments[0];
	arguments[0] = this;
	this.tree.applyListeners(name, arguments);
});
*/

Treenode.prototype.emit = function(name){
	this.tree.applyListeners(name, [this].concat(toArray(arguments, 1)));
	return this;
};

var Tree = this.Tree = new Class({
	Implements: Emitter,
	nodeConstructor: Treenode,
	initializers: [],
	
	initialize: function(){
		this.setRoot(this.createRoot.apply(this, arguments));
		this.initializers.forEach(function(init){ init.call(this); }, this);
	},
	
	toString: function(){
		return 'Tree';
	},
	
	createNode: function(data){
		var node;
		
		if( data instanceof this.nodeConstructor ){
			node = data;
		}
		else{
			node = new this.nodeConstructor(this, Tree.toNode(data));
		}
		
		return node;
	},
	
	createRoot: function(){
		var root = this.createNode({
			name: 'root',
			children: arguments,
			focused: true,
			expanded: true,
			noinsert: true,
			noremove: true,
			nocopy: true,
			norename: true,
			noexpand: true,
			nocontract: true,
			noactive: true,
			noselect: true,
			nolight: true		
		});
		return root;
	},
	
	setRoot: function(root){
		this.removeRoot();
		this.root = root;
		this.root.isRoot = true;
		this.eachNode(function(node){ node.emit('enter'); });
	},
	
	removeRoot: function(){
		if( this.root ){
			delete this.root.isRoot;
			this.root.emancipate();
			delete this.root;
		}
	},
	
	eachNode: function(fn, bind){
		this.root.crossAll(fn, bind);
		return this;
	},
	
	getNode: function(expression){
		var node = null;
		
		if( expression != null ){
			if( typeof expression.toTreenode == 'function' ) node = expression.toTreenode();
			else node = this.root.getNode(expression);
		}
		
		return node;
	},
	
	getNodes: function(){
		var i = 0, j = arguments.length, nodes = [];
		
		for(;i<j;i++){
			node = this.getNode(arguments[i]);
			if( node ) nodes.push(node);
		}
		
		return nodes;
	},
	
	propertyChange: function(node, property, value, current, proto){
		this.emit('change:' + property, node, value, current, proto);
		this.applyListeners('propertyChange', arguments);
	}
});

Tree.toNode = function(data){
	var node = data;
	
	switch(typeof data){
		case 'string': case 'number':
			node = {name: data};
		break;
		case 'object':
			if( data !== null && typeof data.toTreenode == 'function' ) node = data.toTreenode();
		break;
	}
	
	if( !node ) throw new Error('unable to create node from ' + data);
	
	return node;
};

Array.implement('toTreenode', function(){ return {children: this}; });
Treenode.implement('toTreenode', Function.THIS);
Tree.implement('toTreenode', function(){ return this.root.toTreenode(); });

Tree.toChildnodes = function(data){
	if( data == '' || data == null ) return [];
	
	switch(typeof data){
		case 'string': case 'number': return [data];
		case 'object': if( typeof data.toChildnodes == 'function' ) return data.toChildnodes();
		default: return toArray(data);
	}
};

Array.implement('toChildnodes', Function.THIS);
Treenode.implement('toChildnodes', function(){ return this.children; });
Tree.implement('toChildnodes', function(){ return this.root.toChildNodes(); });

Treenode.implement({
	prepareChildren: function(children){
		return Tree.toChildnodes(children);
	},
	
	parseChildren: function(children, copy){
		children = this.prepareChildren(children);
		children.forEach(this.appendChild, this);
		return children;
	},
	
	appendChild: function(child, index, children){
		child = this.tree.createNode(child);
		children[index] = child;
		child.parentNode = this;
		
		return child;
	},
		
	// le noeud adopte un nouvel enfant
	adopt: function(child, index){
		child = this.tree.createNode(child);
		index = typeof index != 'number' ? this.children.length : index.limit(0, this.children.length);
		
		child.parentNode = this;
		this.children.splice(index, 0, child);
		child.crossAll(function(node){ node.emit('enter'); }, null, true);
		this.emit('adopt', child, index);
		
		return this;
	},
	
	// fait sortir le noeud de son parent
	emancipate: function(){
		if( this.parentNode ){
			this.parentNode.children.remove(this);
			delete this.parentNode;	
		}
		this.crossAll(function(node){ node.emit('leave'); }, null, true);
		this.emit('emancipate');
		
		return this;
	},
	
	setChildren: function(children){
		children = this.prepareChildren(children);
		
		// ceci permet de regrouper les logiques d'insertion et de supression dans adopt et emancipate
					
		// supprime les enfants actuels avant de mettre les nouveaux
		var i = this.children.length;
		while(i--) this.children[0].emancipate();
		// appelle adopt sur chaque child
		children.forEach(this.adopt, this);
		
		return this;
	},
	
	getIndex: function(){
		return this.parentNode.children.indexOf(this);
	},
	
	contains: function(node){
		while(node){
			if( node == this ) return true;
			node = node.parentNode;
		}
		return false;
	}
});

// find
[
	'cross','crossAll','crossUp','crossDirection','crossLeft','crossRight','crossAround','matchIterator','matchFirst','matchAll', 
	'getChild','getChilds','getParent','getParents',//'getLastchild','getLastchilds',
	'getNext','getNexts','getPrev','getPrevs','getSibling','getSiblings',
	'match'
].forEach(function(name){ Treenode.prototype[name] = Element.prototype[name]; });

Treenode.prototype.getNode = Element.prototype.getElement;
Treenode.prototype.getNodes = Element.prototype.getElements;

Tree.plugins = {};
Tree.definePlugin = function(name, plugin){
	Tree.prototype.getPlugins()[name] = plugin;
};

Tree.implement({
	plugins: [],
	
	hasPlugin: function(name){
		return this.plugins.contains(name);
	},
	
	getPlugins: function(){
		return Tree.plugins;
	},
	
	getPlugin: function(name){
		return this.getPlugins()[name];
	},
	
	addPlugin: function(name){
		var plugin;

		if( !name ) throw new Error('No plugin name given');
		plugin = this.getPlugin(name);
		if( !plugin ) throw new Error('Le plugin '+name+' existe pas');
		
		if( plugin.node ) Object.merge(this.nodeConstructor.prototype, plugin.node);
		if( plugin.tree ) Object.merge(this, plugin.tree);
		if( plugin.events ) this.on(plugin.events);
		if( plugin.init ) plugin.init.call(this);
	}
});

Tree.prototype.initializers.push(function(){
	this.plugins = [].concat(this.plugins);
});

Tree.implement({
	types: {},
	getTypeProperties: function(type){
		return this.types[type];
	}
});

Tree.prototype.on({
	'change:type': function(node){
		node.updateProto();
	}
});

})();

// actions
(function(){

Treenode.implement({	
	never: function(action){
		return this.get('no' + action) === true;
	},
	
	checkAction: function(action, args){
		return this.tree.checkAction(action, this, args);
	},
	
	can: function(action){
		return this.checkAction(action, toArray(arguments, 1));
	},
	
	demandAction: function(action, args){
		this.tree.demandAction(action, this, args);
		return this;
	},
	
	applyAction: function(action, args){
		this.tree.applyAction(action, this, args);
		return this;
	},
	
	callAction: function(action){
		return this.applyAction(action, toArray(arguments, 1));
	}
});

Tree.implement({
	actions: {},
	propertyUpdateActions: {},
	propertyObtainActions: {},
	
	// crée la fonction permettant l'écriture compacte: tree.rename('a', 'b')
	createShortcutMethod: function(name){
		return function(node){
			if( node instanceof Array ) this.getNodes.apply(this, node).apply(name, toArray(arguments, 1));
			else if( node = this.getNode(node) ) node[name].apply(node, toArray(arguments, 1)); // éxécute la méthode sur node
				
			return this;
		};
	},
	
	addShortcutMethod: function(name){
		this[name] = this.createShortcutMethod(name);
	},
	
	deployMethod: function(name, method){
		this.nodeConstructor.prototype[name] = method;
		this.addShortcutMethod(name);
	},
	
	defineAction: function(name){
		this.deployMethod(name, Treenode.prototype.callAction.curry(name));
	},
	
	getPropertyActionObject: function(updateObtain){
		return this[updateObtain == 'update' ? 'propertyUpdateActions' : 'propertyObtainActions'];
	},
	
	getPropertyAction: function(property, updateObtain){
		return this.getPropertyActionObject(updateObtain)[property];
	},
	
	setPropertyAction: function(property, updateObtain, action){
		this.getPropertyActionObject(updateObtain)[property] = action;
		this.deployMethod(action, this.nodeConstructor.prototype[updateObtain].curry(property));
	},
	
	hasDefinition: function(name, part){
		return name in this.actions && part in this.actions[name];
	},
	
	define: function(name, part, value){
		if( !(name in this.actions) ) this.actions[name] = {};
		this.actions[name][part] = value;
	},
	
	getDefinition: function(name, part){
		return name in this.actions ? this.actions[name][part] : undefined;
	},
	
	removeDefinition: function(name, part){
		if( this.hasDefinition(name, part) ){
			delete this.actions[name][part];
		}
	},
	
	applyDefinition: function(name, part, bind, args){
		var value = this.getDefinition(name, part);
		return typeof value == 'function' ? value.apply(bind, args) : undefined;
	},
	
	callDefinition: function(name, part, bind){
		return this.applyDefinition(name, part, bind, toArray(arguments, 3));
	},
	
	checkAction: function(action, node, args){
		var no = node.get('no' + action);
		
		if( no === true ) return false;
		
		args = args || [];
		// vérification externe (le noeud possède une propriété no[action] = function(){})
		if( typeof no == 'function' && no.apply(node, args) ) return false;
		
		// vérification interne
		if( this.applyDefinition(action, 'prevent', node, args) ) return false;
		
		return true;
	},
	
	handleAction: function(call, callback){
		var
			action = call[0],
			node = call[1],
			args = call[2],
			preparedArgs = this.applyDefinition(action, 'arguments', node, args)
		;
		
		if( preparedArgs ){
			call[2] = args = preparedArgs;
		}
		
		if( this.applyDefinition(action, 'cancel', node, args) ) return callback.call(this);
		if( !this.checkAction(action, node, args) ) return callback.call(this);
		
		callback.call(this, call);
	},
	
	demandAction: function(action, node, args){
		this.handleAction(arguments, function(call){
			if( call ) this.applyAction.apply(this, call);
		});
		return this;
	},
	
	applyAction: function(action, node, args){
		args = args || [];
		
		var eventArgs = [node], i = 0, j = args.length, callback;
		for(;i<j;i++){
			// if( typeof args[i] == 'function' ) callback = args[i];
			// else
				eventArgs[i+1] = args[i];
		}
		
		if( !(node instanceof Treenode) ) console.trace('node must be a treenode');
		
		// this.action = action;
		this.applyListeners('before:' + action, eventArgs);
		this.applyDefinition(action, 'method', node, args);
		this.applyListeners(action, eventArgs);
		// delete this.action;
		
		// if( callback ) callback.apply(node, args)
		
		return this;
	}
});

// update, obtain
['update', 'obtain'].forEach(function(method){
	// update, action correspondant à setProperty	
	Tree.prototype.defineAction(method);
	
	Tree.prototype.actions[method] = {
		arguments: function(key){
			var action = this.tree.getPropertyAction(key, method);
			if( action ){
				var args = this.tree.applyDefinition(action, 'arguments', this, toArray(arguments, 1));
				if( args ){
					args.unshift(key);
					return args;
				}
			}
		},
		prevent: function(key, value){
			var action = this.tree.getPropertyAction(key, action);
			if( action ) return !this.can(action, value);
		},
		method: Treenode.prototype.setProperty
	};
	
	Tree.prototype.on('before:' + method, function(node, key, value){
		var action = this.getPropertyAction(key, method);
		if( action ) this.applyListeners('before:' + action, [node].concat(toArray(arguments, 2)));
	});
	
	Tree.prototype.on(method, function(node, key, value){
		var action = this.getPropertyAction(key, method);
		if( action ) this.applyListeners(action, [node].concat(toArray(arguments, 2)));
	});
	
});

Tree.prototype.setPropertyAction('name', 'update', 'rename');

})();

// transform
(function(){

Treenode.implement({
	prepareCopy: function(){
		return this.clone(true);
	}
});

Tree.implement({
	isExternal: function(node){
		return node.tree != this;
	},
	
	getDestination: function(into, index){
		into = this.getNode(into);
		
		if( !into ) return null;
		
		if( typeof index != 'number' ){
			if( index == 'before' ){ index = into.getIndex(); into = into.parentNode; }
			else if( index == 'after' ){ index = into.getIndex() + 1; into = into.parentNode; }
			else index = into.children.length;
		}
		else{
			index = index.limit(0, into.children.length);
		}
				
		return [into, index];			
	},
	
	importNode: function(node, into, index){
		var tree = node.tree, clone;
		
		// il faut crée un clone de ce noeud dans l'arbre en cours
		node.tree = this;
		clone = node.clone(true);
		node.tree = tree;
		
		// puis on insère ce clone dans l'arbre
		into.insert(clone, index);
		
		return this;
	}
});

Tree.prototype.actions.remove = {
	method: Treenode.prototype.emancipate
};
Tree.prototype.actions.insert = {
	method: Treenode.prototype.adopt,
		
	arguments: function(child, index){
		return [this.tree.createNode(child), typeof index != 'number' ? this.children.length : index.limit(0, this.children.length)];
	}
};
Tree.prototype.actions.copy = {
	method: function(into, index, copy){
		into.callAction('insert', copy, index); 
	},
	arguments: function(into, index){
		var destination = this.tree.getDestination(into, index);
		
		if( destination ){
			into = destination[0];
			index = destination[1];
			return [into, index, this.prepareCopy(into, index)];
		}
	},
	cancel: function(into, index){
		if( !into ) return true;
		// lorsque le noeud provient d'un autre arbre on envoit pas au serveur copy mais insert (on crée le noeud)
		if( into.tree.isExternal(this) ){
			into.tree.importNode(this, into, index);
			return true;
		}
	},
	
	prevent: function(into, index, copy){
		if( !into.can('insert', copy, index) ) return true;
	}
};
Tree.prototype.actions.move = {
	method: function(into, index){
		// comme le noeud par de son parent actuel, au moment de l'insérer l'index change
		if( into == this.parentNode && index > this.getIndex() ) index--;
		into.callAction('insert', this.emancipate(), index);
	},
	
	arguments: function(into, index){
		return this.tree.getDestination(into, index);
	},
	
	cancel: function(into, index){
		if( !into ) return true;
		
		var currentIndex = this.getIndex();
		
		// déjà là ou on veut le mettre
		if( this.parentNode == into && (currentIndex == index || (index > currentIndex && index - 1 == currentIndex)) ) return true;
		// lorsque le noeud provient d'un autre arbre il ne s'agit pas de move mais de insert
		if( into.tree.isExternal(this) ){
			this.remove();
			into.tree.importNode(this, into, index);
			return true;
		}
	},
	
	prevent: function(into, index){
		// Impossible node contient into
		if( this.contains(into) ) return true;
		// into n'accepte pas de recevoir node
		if( !into.can('insert', this, index) ) return true;
		// le noeud ne peut être supprimé, et ne peut donc pas être déplacé dans un autre arbre
		if( into.tree.isExternal(this) && !this.can('remove') ) return true;
	}
};

['remove', 'insert', 'copy', 'move'].forEach(Tree.prototype.defineAction, Tree.prototype);

})();
