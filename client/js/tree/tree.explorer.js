// Implement types directly in explorerTreeView

var ExplorerNodeView = new Class({
	Extends: NodeView,
	
	calcImageSrc: function(src){
		// display an empty image when no img is set
		if( !src ) return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';			
		return this.tree.imageSrc + src;
	},
	
	getImageSrc: function(){
		// pour fileTree, lorsque le noeud représente une image son chemin mène à son image, utile pour plus tard
		//if( this.get('group') == 'img' && this.tree.element.hasClass('grid') ) return this.getPath();
		return this.calcImageSrc(this.get('img'));
	},
	
	drawImg: function(img){
		var dom = this.getDom('img');
		if( dom ) dom.src = this.calcImageSrc(img);
	},
	
	getTrunkAttributes: function(){
		var attr = NodeView.prototype.getTrunkAttributes.call(this);
		
		if( this.isExpandable() ) attr['class']+= ' expandable';
		
		return attr;
	},
	
	getNodeAttributes: function(){
		var attr = NodeView.prototype.getNodeAttributes.call(this);
		
		if( this.tree.options.drag ) attr.draggable = true;
		
		return attr;
	},
	
	getNodeHTMLContent: function(){
		return '\
			<span class="tool"></span>\
			'+(this.tree.options.imageSrc ? '<img class="img" alt="" src="' + this.getImageSrc() + '" />' : '')+'\
			<span class="name">' + this.getHTMLName() + '</span>\
		';
	},
	
	isTrunk: function(element){
		return this.trunk == element;
	},
	
	isDOMEventTarget: function(e){
		return this.tree.element.hasClass('compact') ? !this.isTrunk(e.target) : true;
	},
	
	checkUnselect: function(e){
		// unselectother si select appelé sans event
		if( !e ) return false;
		// if( e.target.hasClass && e.target.hasClass('tool') ) return false;
		// n'unselect pas si control ou shift appuyé, ou mousemove (compat avec selectionRectangle)
		if( e.control || e.shift ) return false;
		// si déjà selected mousedown ne peut pas le désélectionner (compat avec drag)
		if( this.hasState('selected') ) return e.type != 'mousedown';
		
		return true;
	},
	
	unselectOther: function(e){
		if( this.checkUnselect(e) ){
			this.tree.unselect(this.tree.selecteds.filter(function(selected){ return selected != this; }, this), e);
		}
	},
	
	keynav: function(e){
		var
			key = e.key,
			node,
			match = function(item){ return item.can('focus', e); },
			navList = this.tree.getNavList(),
			index = navList.indexOf(this)
		;
		
		// ça ça ne devrait être que dans multiselection
		if( e.control && key == 'a' ){
			this.tree.select(navList, e);
		}
		else if( key == 'enter' ){
			this.active(e);
		}
		else if( key == 'up' || key == 'down' ){
			node = navList.find(match, key == 'up' ? 'left' : 'right', index, this.tree.navloop);
		}
		else if( key == 'pagedown' || key == 'pageup' ){
			if( index < 0 ) index = 0;
			count = this.tree.getVisibleCount(navList[index]);
			
			// sélectionne le noeud le plus en haut ou en bas des noeuds que je vois
			if( key == 'pageup' ) node = navList.find(match, 'right', Math.max(index - count, 0) - 1, index);
			else node = navList.find(match, 'left', Math.min(index + count, navList.length - 1) + 1, index);
		}
		else if( !e.control && (typeof key == 'number' || key.match(/^[a-zA-Z]$/)) ){
			node = navList.find([match, key+'*'], 'right', index, true);
		}
		
		if( node ){
			e.preventDefault();
			node.naviguate(e);
		}
	},
	
	naviguate: function(e){
		this.focus(e);
		this.select(e);
	}
});

var ExplorerTreeView = new Class({
	Extends: TreeView,
	nodeConstructor: ExplorerNodeView,
	options: {
		imageSrc: './img/tree/extensions/',
		light: true,
		multiSelection: true,
		selectionRectangle: false,
		drag: true,
		menu: true
	},
	DOMEventTypesNode: {
		mouseout: function(e){ return e.relatedTarget ? e.relatedTarget.toTreenode() : null; },
		keydown: function(e){ return this.focused; }
	},
	
	initialize: function(options){		
		this.options = Object.clone(this.options);
		if( options ) Object.merge(this.options, options);
		
		this.eventList = new EventList('mousedown', 'click', 'dblclick', 'keydown');
		
		if( this.options.imageSrc ) this.on('change:img', function(node, img){ node.drawImg(img); });
		if( this.options.multiSelection ){
			this.selecteds = [];
			
			this.off('select', this.setSelected);
			this.off('unselect', this.removeSelected);
			
			this.on({
				'before:select': function(node, e){
					node.unselectOther(e);
				},
				
				select: function(node){
					this.selecteds.push(node);
				},
				
				unselect: function(node){
					this.selecteds.remove(node);
				},
				
				'before:focus': function(node, e){
					if( e && (e.type == 'mousedown' || e.type == 'keydown') ){
						if( e.shift ){
							e.preventDefault();
							this.shiftNode = this.shiftNode || this.focused || this.visibles[0];
							node.selectTo(this.shiftNode, e);
						}
						else{
							delete this.shiftNode;
						}
					}
				}
			});
			if( this.options.selectionRectangle ) this.addPlugin('selectionRectangle');
		}
		if( this.options.light ) this.eventList.add('mouseover', 'mouseout');
		if( this.options.drag ) this.addPlugin('drag');
		if( this.options.menu ) this.addPlugin('menu');
		
		TreeView.prototype.initialize.call(this);
	},
	
	toString: function(){
		return 'ExplorerTreeView';
	},
	
	createElement: function(){
		return new Element('div', {
			'class': 'tree compact unselectable',
			'tabindex': 0,
			'style': 'position:relative'
		});
	},
	
	unlightAll: function(e){
		if( this.lighted ) this.lighted.unlight(e);
	},
	
	unselectAll: function(e){
		// selecteds.map puisque le tableau selecteds est modifié par unselect
		if( this.options.multiSelection ) this.unselect(this.selecteds.map(Function.RETURN), e);
		else if( this.selected ) this.selected.unselect(e);
	},
	
	getNavList: function(){
		return this.visibles;
	},
	
	getVisibleCount: function(node){
		var total = node.trunk.offsetParent.clientHeight;
		var count = parseInt(total / node.tree.getLine(node)) - 1;
			
		return count;
	}
});

ExplorerTreeView.prototype.deployMethod('selectTo', function(node, e){
	var from, to, min, max, unselectList, selectList, i;
	
	node = this.tree.getNode(node);
	
	if( !node ) return this;
	
	from = this.getVisibleIndex();
	to = node.getVisibleIndex();
	
	if( from == -1 || to == -1 ) return this;
	
	if( from > to ){ min = to; max = from; }
	else{ min = from; max = to; }
	
	// désélectionne tout les noeuds selectionné qui ne sont pas dans l'intervalle		
	unselectList = this.tree.selecteds.filter(function(selected){
		var index = selected.getVisibleIndex();
		return index < min || index > max;
	});
	
	// sélectionne les noeuds de l'intervalle
	selectList = [];
	i = max - min + 1;
	while(i){
		i--;
		selectList.push(this.tree.visibles[i + min]);
	}
	
	this.tree.unselect(unselectList, e);
	this.tree.select(selectList, e);
	
	return this;
});

ExplorerTreeView.prototype.deployMethod('scrollTo', function(dom){
	if( this.trunk && this.isVisible() ){
		var element = this.getDom(typeof dom == 'string' ? dom : 'node');
		if( element ) element.keepIntoView();
	}
	return this;
});

// States
ExplorerTreeView.prototype.defineState('lighted', 'light', 'unlight');
ExplorerTreeView.prototype.defineState('focused', 'focus', 'blur');
ExplorerTreeView.prototype.defineState('selected', 'select', 'unselect');
ExplorerTreeView.prototype.defineState('expanded', 'expand', 'contract');
ExplorerTreeView.prototype.defineState('actived', 'active', 'unactive');
ExplorerTreeView.prototype.defineState('disabled', 'disable', 'enable');
ExplorerTreeView.prototype.defineState('hidden', 'hide', 'show');

// expand ne peut pas si le noeud n'a pas d'enfant
ExplorerTreeView.prototype.actions.expand.prevent = function(){ return this.hasState('disabled') || !this.children.length; };
// active ne peut pas si le noeud est caché
ExplorerTreeView.prototype.actions.active.prevent = function(){ return this.hasState('disabled') || this.hasState('hidden'); };
// enable si !disabled
delete ExplorerTreeView.prototype.actions.enable.prevent;
delete ExplorerTreeView.prototype.actions.disable.prevent;

ExplorerTreeView.prototype.on({
	enter: function(node){
		// node.eachState(node.gainState, node);
	},
	
	leave: function(node){
		node.unselect().blur().unlight();
	},
	
	'before:copy': function(node, into){
		// on copie un noeud dans le même arbre l'origine perds son état selected, lighted et focused
		// de cette manière l'arbre conserve la bonne référence du noeud focused,lighted et visuellement c'est plus agréable
		if( node.tree == into.tree ) node.unselect().blur().unlight();
	},
	
	focus: function(node, e){
		node.scrollTo();
	},
	
	blur: function(){
		// blur d'un noeud sans qu'aucun autre ne prenne se place
		if( !this.focused ) this.focused = node.getNext() || node.getPrev() || node.parentNode || this.root;
	}
});

['lighted', 'selected', 'focused'].forEach(function(state){
	var stateOn = ExplorerTreeView.prototype.getStateAction(state, true);
	var stateOff = ExplorerTreeView.prototype.getStateAction(state, false);
	
	ExplorerTreeView.prototype.on(stateOn, ExplorerTreeView.prototype['set' + state.capitalize()] = function(node, e){
		var current = this[state];
		this[state] = node;
		if( current && current != node ){
			current.setState(state, false, e);
		}
	});
	
	ExplorerTreeView.prototype.on(stateOff, ExplorerTreeView.prototype['remove' + state.capitalize()] = function(node, e){
		if( this[state] == node ){
			delete this[state];
		}
	});
});

// DOMEvents
ExplorerTreeView.prototype.DOMEvents = {
	mouseover: function(node, e){
		if( node && node.isDOMEventTarget(e) ) node.light(e);
		else this.unlightAll(e);
	},
	
	mouseout: function(node, e){
		if( !node || !node.isDOMEventTarget(e) ) this.unlightAll(e);
	},
	
	mousedown: function(node, e){
		if( node && node.isDOMEventTarget(e) ){
			if( e.target.hasClass('tool') ) node.toggleState('expanded', e);
			if( this.options.multiSelection && e.control ) node.toggleState('selected', e);
			else node.select(e);
			node.focus(e);
		}
		else{
			this.unselectAll(e);
		}
	},
	
	click: function(node, e){
		if( node && node.isDOMEventTarget(e) ){
			if( this.options.multiSelection ) node.unselectOther(e);
		}
		else this.unselectAll(e);
	},
	
	dblclick: function(node, e){
		if( node && node.isDOMEventTarget(e) ){
			if( !e.target.hasClass('tool') ){
				if( this.options.menu ) this.menu.activeFirst(e);
				else node.toggleState('expanded', e);
			}
		}
	},
	
	keydown: function(node, e){
		if( !node ) return;
		
		var left = e.key == 'left', right = e.key == 'right', node;
		
		if( left || right ){
			if( left ? node.hasState('expanded') : node.isExpandable() ) node.toggleState('expanded', e);
			else{
				node = left ? node.parentNode : node.firstVisible();
				if( node ){
					e.preventDefault();
					node.naviguate(e);
				}
			}
		}
		else{
			node.keynav(e);
		}
	}
};

// Expandable
ExplorerNodeView.implement({
	emancipate: function(){
		if( this.parentNode.children.length == 1 ) this.parentNode.drawExpandable(false); // suppression du dernier enfant -> expandable:false
		else this.parentNode.updateExpandable();
		
		return NodeView.prototype.emancipate.call(this);
	},
	
	drawHidden: function(value){
		this.parentNode.updateExpandable(); // show/hide d'un enfant
		return NodeView.prototype.drawHidden.call(this, value);
	},
	
	isExpandable: function(){
		return this.firstVisible() || this.can('expand');
	},
	
	drawExpandable: function(value){
		var dom = this.getDom('trunk');
		if( dom ) dom[value ? 'addClass' : 'removeClass']('expandable');
	},
	
	updateExpandable: function(){
		this.drawExpandable(this.isExpandable());
	},
	
	drawExpanded: function(value){
		if( this.trunk ){
			this.updateExpandable();
			if( value ){
				if( this.branch ) this.branch.removeProperty('hidden');
				else this.createBranch();
			}
			else{
				if( this.branch ) this.branch.setProperty('hidden', 'hidden');
			}
			
			if( this.isVisible() ){
				if( this.tree.element.hasFocus() ) this.scrollTo('trunk');
				this.tree.updateVisibles();
			}
		}
	}
});

ExplorerTreeView.prototype.on({
	createTrunk: function(node, trunk){
		// si le noeud est expanded faut dessiner son contenu
		if( node.hasState('expanded') ) node.drawExpanded(true);
	},
		
	adopt: function(node, child){
		if( node.children.length == 1 ) node.updateExpandable(); // ajout du premier enfant -> tool:plus
		if( node.isVisible() ) node.expand();
	},
		
	expand: function(node){
		node.drawExpanded(true);
	},
		
	contract: function(node){
		node.drawExpanded(false);
	}
});