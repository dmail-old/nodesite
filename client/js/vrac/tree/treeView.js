/*
---

name: TreeView

description: allow to create an HTML view of a Tree. The view can or not be linked to a Tree instance

NOTE
defaultSelected de selector ressemble aussi beaucoup à une sorte de defaultFocused que j'utilise déjà avec states

FIX

...
*/

var NodeView = new Class({
	Extends: Treenode,

	getTrunkAttributes: function(){
		var trunkclass = 'trunk', attr = {}, uid = this.uid;

		if( typeof uid != 'number' ) NodeView.uids[uid = this.uid = NodeView.UID++] = this;
		attr[NodeView.uidattr] = uid;

		if( !this.prevVisible() ) trunkclass+= ' first';
		if( !this.nextVisible() ) trunkclass+= ' last';
		if( this.has('class') ) trunkclass+= ' ' + this.get('class');
		this.eachState(function(state){ trunkclass+= ' ' + state; });
		attr['class'] = trunkclass;

		if( this.hasState('hidden') ) attr['hidden'] = 'hidden';

		return attr;
	},

	getNodeAttributes: function(){
		var attr = {};

		attr['class'] = 'node';

		return attr;
	},

	getNodeHTMLContent: function(){
		return '<span class="name">' + this.getHTMLName() + '</span>';
	},

	getNodeHTML: function(){
		return '<div' + Object.toAttrString(this.getNodeAttributes()) + '>' + this.getNodeHTMLContent() + '</div>';
	},

	getTrunkHTML: function(){
		return '<li' + Object.toAttrString(this.getTrunkAttributes()) + '>' + this.getNodeHTML() + '</li>';
	},

	// crée et retourn le tronc du noeud (son conteneur)
	createTrunk: function(){
		var trunk = this.trunk;
		if( !trunk ){
			trunk = this.trunk = this.getTrunkHTML().toElement();
			this.emit('createTrunk', trunk);
		}
		return trunk;
	},

	// crée et retourn la branche du noeud (ses enfants)
	createBranch: function(){
		var branch = this.branch;

		if( !branch ){
			branch = this.branch = new Element('ul', {'class':'branch'});
			this.children.forEach(function(child){ branch.appendChild(child.createTrunk()); });
			this.emit('createBranch', branch);
		}
		// this.isRoot -> la branche de la racine n'a pas besoin d'être insérer il s'agit de this.element
		if( !branch.parentNode && !this.isRoot ) this.trunk.insertBefore(branch, this.getDom('node').nextSibling);

		return branch;
	},

	getDom: function(what){
		var element;

		if( what == 'branch' ) return this.branch;
		element = this.trunk;
		if( what == 'trunk' ) return element;
		if( !element ) return null;
		element = element.getChild(function(el){ return el.hasClass('node'); });
		if( what == 'node' ) return element;

		return element.getElement(function(el){ return el.hasClass(what); });
	},

	// appelé chaque changement de visibilitée dans l'arbre (insert, remove, hide, show)
	changeVisibility: function(hidden){
		var parent = this.parentNode, prev, next, hasPrev, hasNext;

		if( parent ){
			if( parent.branch ){
				prev = this.prevVisible();
				next = this.nextVisible();

				if( prev && !next ) prev.drawLast(hidden);
				else if( next && !prev ) next.drawFirst(hidden);
				this.drawFirst(Boolean(prev) == Boolean(hidden));
				this.drawLast(Boolean(next) == Boolean(hidden));
			}
		}
	},

	calcHTMLName: function(name){
		return this.get('htmlName') || name;
	},

	getHTMLName: function(){
		return this.calcHTMLName(this.get('name'));
	},

	drawName: function(name){
		var dom = this.getDom('name');
		if( dom ) dom.innerHTML = this.calcHTMLName(name);
	},

	drawClass: function(name, current){
		var dom = this.getDom('trunk');
		if( dom ) dom.removeClass(current).addClass(name);
	},

	drawFirst: function(value){
		var dom = this.getDom('trunk');
		if( dom ) dom[value ? 'addClass' : 'removeClass']('first');
	},

	drawLast: function(value){
		var dom = this.getDom('trunk');
		if( dom ) dom[value ? 'addClass' : 'removeClass']('last');
	},

	drawInsert: function(child){
		var next = child.getNext();
		this.branch.insertBefore(child.createTrunk(), next ? next.trunk : null);
		if( !child.hasState('hidden') ){
			if( this.mayHaveVisible() ) this.tree.updateVisibles();
			child.changeVisibility();
		}
		// si la branch du parent a été enlevé (par le remove de son dernier enfant) l'insertion du premier enfant doit la réinsérer
		if( !this.isRoot && this.children.length == 1 ) this.trunk.insertBefore(this.branch, this.getDom('node').nextSibling);
	},

	drawRemove: function(){
		var parent = this.parentNode;

		if( this.trunk ) this.trunk.dispose();
		if( parent ){
			this.changeVisibility(true);
			if( parent.children.length == 1 && parent.branch ) parent.branch.dispose();
		}
	},

	drawHidden: function(value){
		if( this.trunk ){
			if( value ){
				this.trunk.setProperty('hidden', 'hidden');
				if( this.isVisible() ) this.tree.updateVisibles();
			}
			else{
				this.trunk.removeProperty('hidden');
				if( this.isRoot || this.parentNode.mayHaveVisible() ) this.tree.updateVisibles();
			}

			this.changeVisibility(value);
		}
	},

	drawState: function(state, value){
		var dom = this.getDom('trunk');
		if( dom ) dom[value ? 'addClass' : 'removeClass'](state);
	},

	updateHTMLName: function(){
		this.drawName(this.getHTMLName());
	},

	emancipate: function(){
		// ceci doit se faire avant suppresion de la référence vers le parent
		this.drawRemove();
		Treenode.prototype.emancipate.call(this);
		// ceci doit se faire après la suppresion de la référence vers le parent
		if( this.isVisible() ) this.tree.updateVisibles();
		return this;
	},

	getVisibleIndex: function(){
		return this.tree.visibles.indexOf(this);
	},

	isVisible: function(){
		return this.isRoot || this.getVisibleIndex() > -1;
	},

	// retourne si un enfant de ce noeud serait visible
	mayHaveVisible: function(){
		// les enfants sont visibles si le noeud est root
		if( this.isRoot ) return true;
		// sont visible si le noeud est expanded et visible
		return this.hasState('expanded') && this.isVisible();
	},

	// retourne si ce noeud doit être visible (son parent doit pouvoir avoir des visibles et lui même ne doit pas être caché)
	mustBeVisible: function(){
		return !this.hasState('hidden') && this.parentNode.mayHaveVisible();
	},

	hasVisible: function(){
		return this.mayHaveVisible() && Boolean(this.firstVisible());
	},

	firstVisible: function(){
		return this.getChild(NodeView.visible);
	},

	prevVisible: function(){
		return this.getPrev(NodeView.visible);
	},

	nextVisible: function(){
		return this.getNext(NodeView.visible);
	}
});

var TreeView = new Class({
	Extends: Tree,
	nodeConstructor: NodeView,
	DOMEventTypesNode: {},

	initialize: function(){
		Tree.prototype.initialize.call(this);
		this.setElement(this.createElement());
	},

	bindModel: function(tree){
		// nodeConstructor create an node instance wich is the view of an other node

		this.nodeConstructor = new Class({
			Extends: this.nodeConstructor,

			parseProperties: function(properties){
				this.name = properties.name;
				this.children = this.parseChildren([].concat(properties.children));
				return properties;
			},

			toModel: function(node){
				return this.properties;
			},

			isViewOf: function(node){
				return this.toModel() == node;
			},

			transferToModel: function(method, args){
				var node = this.toModel();
				return node[method].apply(node, args);
			}
		});

		'applyAction hasProperty getProperty setProperty removeProperty hasProto getProto setProto removeProto has get'.split('').forEach(function(name){
			this[name] = function(){ return this.transferToModel(name, arguments); };
		}, this.nodeConstructor.prototype);

		this.tree = tree;
		this.viewEvents = Object.map(this.tree.viewEvents, function(fn){ return fn.bind(this); }, this);
		this.tree.on(this.viewEvents);
		this.root.setChildren(this.tree.root.children);

		return this;
	},

	unbindModel: function(tree){
		if( this.tree ){
			this.tree.off(this.viewEvents);
			delete this.viewEvents;
			delete this.tree;
			delete this.nodeConstructor; // this.nodeConstructor === TreeView.prototype.nodeConstructor
		}
	},

	toNodeModelView: function(node){
		return this.getNode(function(nodeView){
			return nodeView.isViewOf(node);
		});
	},

	destroy: function(){
		this.unbindModel();
		this.destroyElement();
		this.eachNode(function(node){
			delete node.trunk;
			delete node.branch;
			delete NodeView.uids[node.uid];
			delete node.uid;
		});
	},

	toString: function(){
		return 'TreeView';
	},

	getNodeFromDOMEvent: function(e){
		var toNode = this.DOMEventTypesNode[e.type], node;
		if( toNode ) node = toNode.call(this, e);
		else if( e.target ) node = e.target.toTreenode();
		return node;
	},

	DOMEventListener: function(e){
		var node = this.getNodeFromDOMEvent(e);
		this.DOMEvents[e.type].call(this, node, e);
		this.emit('dom:' + e.type, node, e);
	},

	createElement: function(){
		return new Element('div', {'class': 'tree compact unselectable'});
	},

	appendRootElement: function(){
		this.element.appendChild(this.root.branch);
	},

	setElement: function(element){
		this.element = element;
		this.eventList.attach(this.element, this.DOMEventListener.bind(this), true);
		this.root.createBranch();
		this.appendRootElement();
		this.updateVisibles();
		this.emit('setElement', element);
	},

	destroyElement: function(){
		var element = this.element;

		if( element ){
			element.dispose();
			this.root.branch.dispose();
			this.eventList.detach(element);
			delete element;
			this.emit('destroyElement', element);
		}
	},

	getLine: function(node){
		if( !(node = this.getNode(node || 0)) ) return 0;

		// tention pour control ce seras 'size', 'x'
		// on fait -1 parce que dans le CSS on a mit un margin-top:-1px pour éviter le chevauchement des bords des noeuds
		return node.getDom('node').measure('size', 'y') - 1;
	},

	// appelé à chaque expand/contract/hide/show/insert/remove d'un noeud visible
	updateVisibles: function(){
		this.visibles = [];

		this.root.crossAll(function(node){
			if( node.hasState('hidden') ) return 'continue';
			if( node.trunk ){
				this.push(node);
				if( node.children.length && !node.hasState('expanded') ) return 'continue';
			}
		}, this.visibles);

		return this;
	}
});

TreeView.prototype.on({
	toggleState: function(node, state, value, e){
		node.drawState(state, value);
	},

	hide: function(node){
		node.drawHidden(true);
	},

	show: function(node){
		node.drawHidden(false);
	},

	// on peut pas mettre ça dans adopt puisque child ne vaut pas encore tree.createNode(child)
	adopt: function(node, child){
		if( node.branch ) node.drawInsert(child);
	}
});

Tree.prototype.viewEvents = {
	emancipate: function(node){
		this.toNodeModelView(node).emancipate();
	},

	adopt: function(node, child, index){
		this.toNodeModelView(node).adopt(child, index);
	},

	'change:name': function(node, name){
		this.toNodeModelView(node).drawName(name);
	},

	'change:class': function(node, name, current){
		this.toNodeModelView(node).drawClass(name, current);
	}
};

NodeView.UID = 0;
NodeView.uids = [];
NodeView.uidattr = 'data-uid';

Object.toAttrString = function(source){
	var html = '', name;

	for(name in source) html+= ' ' + name + '="' + source[name] + '"';

	return html;
};

// retourne le noeud qui détient element ou null
Element.implement('toTreenode', function(){
	var element = this, uid;

	while(element){
		if( element.getProperty ){
			uid = element.getProperty(NodeView.uidattr);
			if( uid != null ) return NodeView.uids[uid];
		}
		element = element.parentNode;
	}

	return null;
});

// states
NodeView.visible = function(){ return !this.hasState('hidden'); };
NodeView.disabled = function(){ return this.hasState('disabled'); };

NodeView.implement({
	hasState: function(state){
		return this[state] === true;
	},

	setState: function(state, value, e){
		return this.tree.applyAction(this.tree.getStateAction(state, value), this, [e]);
	},

	toggleState: function(state, e){
		return this.setState(state, !this.hasState(state), e);
	},

	eachState: function(fn, bind){
		this.tree.eachState(function(state){
			if( this.hasState(state) ) fn.call(bind, state);
		}, this);
		return this;
	}
});

TreeView.implement({
	states: {},
	stateNames: [],

	defineState: function(name, on, off){
		this.states[name] = [on, off];
		this.stateNames.push(name);

		this.actions[on] = {
			state: name,
			cancel: function(){ return this.hasState(name); },
			prevent: NodeView.disabled,
			method: function(){ this[name] = true; }
		};
		this.actions[off] = {
			state: name,
			cancel: function(){ return !this.hasState(name); },
			prevent: NodeView.disabled,
			method: function(){ delete this[name]; }
		};

		this.deployMethod(on, NodeView.prototype.setState.curry(name, true));
		this.deployMethod(off, NodeView.prototype.setState.curry(name, false));
		this.on(on, function(node, e){ this.emit('toggleState', node, name, true, e); });
		this.on(off, function(node, e){ this.emit('toggleState', node, name, false, e); });
	},

	eachState: function(fn, bind){
		this.stateNames.forEach(fn, bind);
		return this;
	},

	getStateAction: function(state, value){
		return this.states[state][value ? 0 : 1];
	}
});


