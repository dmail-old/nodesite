/*
---

name: Menu

description: Permet de créer un menu contextuel à la windows

NOTE
- Pourrait être un singleton et couvrir tout le document -> sauf que dans ce cas les raccourcies du menu associés à un certain type d'élément
devront être accessible dès que l'élément à le focus
- !important les raccourcis clavier même lorsqu'il ne sont pas déclenché entraine e.preventDefault je sais pas si ce comportement est bien ou pas...
- langName sers à définir un nom différent de name pour traduire l'action du menu

TODO

FIX

...
*/

var MenuNodeView = new Class({
	Extends: ExplorerNodeView,
	
	getTrunkAttributes: function(){
		var attr = NodeView.prototype.getTrunkAttributes.call(this);
		
		if( this.has('sep') ) attr['class']+= ' sep';
		
		return attr;
	},
	
	getNodeHTMLContent: function(){
		return '\
			<img class="img" alt="" src="' + this.getImageSrc() + '" />\
			<span class="name">' + this.getHTMLName() + '</span>\
			<span class="key">' + this.getHTMLKey() + '</span>\
			<span class="tool"></span>\
		';
	},
	
	calcHTMLName: function(name){
		if( 'langName' in this ) name = this.langName;
		else{
			name = NodeView.prototype.calcHTMLName.call(this, name);
			if( name in lang.menu ) name = lang.menu[name];
		}
		return name;
	},
	
	calcHTMLKey: function(key){
		if( !key ) key = '';
		else if( 'key_' + key in lang ) key = lang['key_' + key];
		return key;
	},
			
	getHTMLKey: function(){
		return this.calcHTMLKey(this.get('key'));
	},
	
	drawKey: function(key){
		var dom = this.getDom('key');
		if( dom ) dom.innerHTML = this.calcHTMLKey(value);
	},		
	
	drawSep: function(value){
		var dom = this.getDom('trunk');
		if( dom ) dom[value ? 'addClass' : 'removeClass']('sep');
	},
	
	naviguate: function(e){
		if( e && e.type == 'keydown' && e.key == 'left' ){
			if( this.isRoot ) return;
			this.contract(e);
		}
		
		this.focus(e);
		this.light(e);
	},
	
	active: function(e){
		if( !this.tree.opened ) this.reset();
		if( this.hasState('actived') && this.type == 'checkbox' ) return this.unactive(e);
		return this.demandAction('active', arguments);
	},
	
	setTimeout: function(action, args){
		if( action != this.timerAction ){
			this.clearTimeout();
			
			// permet d'éviter si node.expanded == undefined d'appeler node.contract
			//if( (action == 'expand' ? this.expanded : !this.expanded) ) return node;
			if( this.checkAction(action, args) ){
				this.timerAction = action;
				this.timer = setTimeout(
					function(){
						this.clearTimeout();
						this.demandAction.apply(this, arguments);
					}.bind(this, action, args),
					this.tree.options[action + 'Delay']
				);
			}
		}
		
		return this;
	},
	
	clearTimeout: function(){
		if( this.timer ){
			clearTimeout(this.timer);
			delete this.timer;
			delete this.timerAction;
		}
		
		return this;			
	},
	
	reset: function(){
		var keepState = this.get('state');
		if( typeof keepState == 'function' ) keepState = keepState.call(this, this.tree.getTarget());
		
		// met tout les états à off sauf celui retourné par state
		// on fait removeProperty pour ne pas déclencher les events unactive, unselect, etc..
		this.eachState(function(state){ if( keepState != state ) this.removeProperty(state); }, this);
		
		if( typeof keepState == 'string' ){
			// met l'état retournée par state à on
			if( !this.hasState(keepState) ) this.setState(keepState, true);
			// si on veut que le noeud reste expanded, donc visible on reset aussi ses enfants
			if( keepState == 'expanded' ) this.children.callEach('reset');
		}
		
		// lorsqu'un noeud ayant une séparation est hidden, la séparation passe au noeud au dessus de lui
		if( this.hasProperty('sep') ){
			var prev = this.getPrev();
			if( prev ){
				if( this.hasState('hidden') ) prev.setProto('sep', true);
				// on enlève la séparation du précédent seulement s'il n'a pas hérité de la séparation par le hide du suivant
				else if( prev.hasProto('sep') ) prev.removeProto('sep');
			}
		}
		
		return this;
	},
	
	isActivable: function(e){
		// reset l'état du noeud
		if( !this.tree.opened ) this.reset();
		return this.can('active', e);
	},
	
	// retourne le premier enfant activable de ce noeud
	getFirstActivable: function(e){
		return this.getChild(function(child){ return child.isActivable(e); });
	}
});

var Menu = new Class({
	Extends: ExplorerTreeView,
	nodeConstructor: MenuNodeView,
	options: {
		imageSrc: "./img/tree/",
		light: true, // override explorertreeview.options.light
		menu: false, // override explorertreeview.options.light
		openby: 'contextmenu', // A tester, autre possibilité: 'mousedown'
		expandDelay: 270,
		contractDelay: 350,
		radioClose: true,
		activeFirstByDblclick: true,
		activeFirstByEnterKey: true
	},
	types: {
		radio: {
			img: 'menuradio.png',
			'class': 'radio'
		},
		checkbox: {
			img: 'menucheckbox.png',
			'class': 'checkbox'
		}
	},
	
	initialize: function(options){
		ExplorerTreeView.prototype.initialize.call(this, options);
		
		this.keyboard = new Keyboard();
		this.navloop = true;
		this.navList = [];
		// contract sur root -> menu.close
		this.root.contract = function(e){ this.tree.close(e); return this; };
		this.focused = this.root;
		
		this.mouseclosing = this.mouseclose.bind(this);
		
		// mouseover est remplacé par mousemove
		this.eventList.remove('mouseover').add('mousemove');
		
		this.targetEventList = new EventList('keydown', 'focus', 'blur');
		
		this.targetEventList.add(this.options.openby);
		// opening by rightclick -> listen to rightclick on menu to prevent it
		if( this.options.openby == 'contextmenu' ) this.eventList.add('contextmenu');
		if( this.options.activeFirstByDblclick ) this.targetEventList.add('dblclick');
	},
	
	destroy: function(){
		this.close();
		this.detach();
		ExplorerTreeView.prototype.destroy.call(this);
	},
			
	createElement: function(){
		return new Element('div', {
			'class': 'tree line menu'
		});
	},
	
	getNavList: function(){
		return this.navList;
	},
	
	updateNavList: function(){
		var node = this.focused || this.root;
		while( !node.isRoot && !node.hasState('expanded') ) node = node.parentNode;
		this.navList = node.getChilds(NodeView.visible); // les enfants visibles
		return this;
	},
	
	updateVisibles: function(){
		TreeView.prototype.updateVisibles.call(this);
		this.updateNavList();
	},
	
	targetDOMEventListener: function(e){
		var action = {
			contextmenu: 'open',
			dblclick: 'dblclick',
			keydown: 'keydown',
			focus: 'updateTarget',
			blur: 'close' // blur de l'élément menu->close
		}[e.type];
		
		if( action ) this[action](e);
	},
	
	attach: function(element){
		this.targetEventList.attach(element, this.targetDOMEventListener.bind(this), true);
		document.body.appendChild(this.element);
		return this;
	},
	
	detach: function(){
		this.targetEventList.detach();
		this.element.dispose();
		return this;
	},
		
	show: function(){
		this.element.style.display = 'block';
	},
	
	hide: function(){
		this.element.style.display = 'none';
	},
	
	move: function(x, y){
		if( x + this.element.measure('size', 'x') > document.measure('size', 'x') ){
			x-= this.element.measure('size', 'x');
		}
		
		this.element.setStyles({
			left: x,
			top: y
		});
	},
	
	moveAtEvent: function(e){
		var x, y;
		if( e && e.rightClick ){
			x = e.page.x;
			y = e.page.y;
		}
		// centre sur la cible
		else{
			pos = this.target.measure('cumulativePosition');
			x = this.target.measure('cumulativePosition', 'x') + this.target.measure('size', 'x') / 2;
			y = this.target.measure('cumulativePosition', 'y') + this.target.measure('size', 'y') / 2;
		}
		
		this.move(x, y);
	},
	
	open: function(e){
		if( this.opened ) return this;
		if( !this.checkTarget(e) ) return this;
		this.opened = true;
		
		this.emit('beforeopen', e);
		
		if( e ) e.preventDefault();
		this.updateTarget(e);
		this.target.focus();
		this.root.children.callEach('reset');
		this.updateVisibles();
		this.root.focus();
		
		document.on('mousedown mouseup', this.mouseclosing);
		
		this.show();
		this.moveAtEvent(e);
		this.emit('open', e);
		
		return this;
	},
	
	close: function(e){
		if( this.opened ){
			delete this.opened;		
			this.hide();
			
			document.off('mousedown mouseup', this.mouseclosing);
			this.emit('close', e);
		}
		
		return this;
	},
	
	checkTarget: function(e){
		// lorsque je clic droit sur un input je n'affiche pas mon contextmenu
		return !e || e.target.get('tag') != 'input';
	},
	
	updateTarget: function(e){
		if( e ) this.target = e.target;
		
		return this;
	},
	
	getTarget: function(){
		return this.target;
	},
	
	activeFirst: function(e){
		var choice = this.root.getFirstActivable(e);
		if( choice ){
			e.preventDefault();
			choice.applyAction('active', arguments);
		}
	},
	
	dblclick: function(e){
		this.updateTarget(e);
		if( this.targetNode ) this.activeFirst(e);
	},
	
	mouseclose: function(e){
		if( this.root.branch.contains(e.target) ) e.preventDefault();
		else this.close(e);
	}
});

Menu.prototype.on({
	adopt: function(node, child){
		if( this.opened && node.branch && child.mustBeVisible() ) child.reset();
	},
	
	'before:light': function(node, e){
		var sibling = node.getSibling(function(node){ return node.hasState('lighted'); }), parent = node.parentNode;
		
		if( sibling ){
			sibling.unlight(e); // si un frère est sélectionné, désélectionne le
			sibling.setTimeout('contract', arguments); //  et amorce sa contraction
		}
		if( parent && !parent.isRoot ){
			parent.light(e); // relight le parent (il peut avoir été unlight si la souris est sortie du menu)
			parent.clearTimeout(); // et previent l'eventuel contract du parent
		}
	},
	
	'before:active': function(node, e){
		if( node.children.length ) node.expand(e);
	},
	
	active: function(node, e){
		var action = node.get('action'), target = this.getTarget();
		
		if( typeof action != 'function' ) action = target[node.name];
		if( typeof action == 'function' ) action.call(node, target, e);
		
		if( node.type == 'radio' ){
			// désactive tout les radios avant celui-ci (tant qu'on trouve pas une séparation)
			node.getPrev(function(node){
				if( node.has('sep') || node.type != 'radio' ) return true;
				node.unactive(e);
			});
			// désactive tout les radios après celui-ci (tant qu'on trouve pas une séparation)
			if( !node.has('sep') ){
				node.getNext(function(node){
					if( node.type != 'radio' ) return true;
					node.unactive(e);
					if( node.has('sep') ) return true;
				});
			}
			if( this.options.radioClose ) this.close(e);
		}
		else if( node.type == 'checkbox' ){
			
		}
		else{
			this.close(e);
		}
	},
	
	'before:expand': function(node, e){
		var sibling = node.getSibling(function(node){ return node.hasState('expanded'); });
		if( sibling ) sibling.contract(e);
	},
	
	expand: function(node, e){
		if( !node.trunk ) return;
		
		if( node.isVisible() ){
			node.children.callEach('reset');
		}	
		
		// si la branche dépasse à droite alors on la met à gauche
		if( !node.branch.hasClass('left') ){
			if( node.trunk.measure('cumulativePosition', 'x') - node.branch.measure('size', 'x') > 0 ){
				if( node.branch.measure('cumulativePosition', 'x') + node.branch.measure('size', 'x') > document.measure('size', 'x') ){
					node.branch.addClass('left');
				}
				
			}
		}
		// si la branche est à gauche et qu'elle dépasse à gauche ou que y'a la place à droite on la met à droite
		if( node.branch.hasClass('left') ){
			if( node.branch.measure('cumulativePosition', 'x') < 0
			|| node.trunk.measure('cumulativePosition', 'x') + node.trunk.measure('size', 'x') + node.branch.measure('size', 'x')
			< document.measure('size', 'x') ){
				node.branch.removeClass('left');
			}
		}
		
		if( e && (e.key == 'right' || e.key == 'enter') ){
			var first = node.firstVisible();
			if( first ) first.naviguate(e);
		}
	},
	
	'change:key': function(node, key){
		node.drawKey(key);
	},
	
	'change:sep': function(node, value){
		node.drawSep(value);
	}
});

Menu.prototype.DOMEvents = {
	mousedown: function(node, e){
		e.preventDefault();
		
		if( node && node.children.length ) node.expand(e);
	},
	
	mousemove: function(node, e){
		if( node ){
			if( !node.hasState('lighted') ){
				node.focus(e);
				node.light(e);
			}
			if( node.children.length ) node.setTimeout('expand', arguments);
		}
	},
	
	mouseout: function(node, e){
		if( !node ){
			var lighted = this.lighted;
			if( lighted ){
				lighted.unlight(e);
				lighted.setTimeout('contract', arguments);
			}
		}
	},
	
	contextmenu: function(node, e){
		e.preventDefault();
		if( node ) node.active(e);
	},
	
	click: function(node, e){
		e.preventDefault();
		
		if( node ) node.active(e);
	},
	
	keydown: function(node, e){
		if( this.opened ){
			switch(e.key){
				// sers juste à prévenir le blur de l'élément par tabulation
				case 'tab':
					e.preventDefault();
				break;
				// échap sur un noeud le contracte (sur root ca ferme le menu puisque root.contract = menu.close)
				case 'esc':
					if( node.isRoot ) node.contract(e);
					else node.parentNode.contract(e).focus(e);
				break;
				// enter active le noeud focused
				case 'enter':
					node.active(e);
				break;
				default:
					if( !this.keyboard.active(e, node) ) ExplorerTreeView.prototype.DOMEvents.keydown.call(this, node, e);
				break;
			}
		}
		else{
			if( e.key == 'enter' && this.options.activeFirstByEnterKey ){
				this.activeFirst(e);
			}
			else{
				this.updateTarget(e);
				if( !this.keyboard.active(e, node) ){
					// TODO à déplacer dans tree.menu
					if( this.tree ) this.tree.DOMEvents.keydown.call(this.tree.focused, e);
				}
			}
		}
	}
};

Menu.prototype.define('active', 'prevent', function(){ return this.hasState('disabled') || this.hasState('hidden') || this.children.length; });
// même si disabled, light fonctionne
Menu.prototype.removeDefinition('light', 'prevent');
Menu.prototype.removeDefinition('unlight', 'prevent');

Menu.prototype.addPlugin('keyshortcut');