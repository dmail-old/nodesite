var SelectorElement = new Class({
	Implements: Emitter,
	html: '\
		<div class="selector">\
			<div class="input" tabindex="0"></div>\
			<div class="tool"><span class="arrow"></span></div>\
		</div>\
	',
	selected: null,
	defaultSelected: null,
	value: '',
	width: 'auto',
	height: 'auto',
	minwidth: 200,
	minheight: 24,
	maxheight: 'auto',
	size: 4,
	
	initialize: function(options){
		if( options ) Object.append(this, options);
		
		this.eventList = new EventList('mousedown', 'keydown', 'blur');
		this.setElement(this.createElement());
	},
	
	destroy: function(){
		this.element.destroy();
		this.emit('destroy');
	},
	
	DOMEventListener: function(e){
		this[e.type](e);
	},
	
	createElement: function(){
		return this.html.toElement();
	},
	
	setElement: function(element){
		this.eventList.attach(element, this.DOMEventListener.bind(this), true);
		this.input = element.getChild(0);
		this.tool = element.getChild(1);
		this.element = element;
	},
	
	setListElement: function(element){
		this.listElement = element;
		this.hideListElement();
		this.appendListElement();
	},
	
	appendListElement: function(){
		this.element.appendChild(this.listElement);
	},
	
	showListElement: function(){
		this.listElement.style.visibility = 'visible';
	},
	
	hideListElement: function(){
		this.listElement.style.visibility = 'hidden';
	},
	
	adaptListElement: function(){
		this.listElement.setStyles({
			width: this.width,
			minWidth: this.minwidth,
			minHeight: this.minheight,
			maxHeight: this.maxheight
		});
	},
	
	insertElement: function(parentNode, sibling){
		parentNode.insertBefore(this.element, sibling);
		this.adaptListElement();
		this.adapt();
		this.emit('insertElement', parentNode);
		return this;
	},
	
	adapt: function(){
		// au minimum la balise doit faire la largeur de ses choix
		// clientWidth ne convient pas puisque omet la largeur de la scrollbar
		// offsetWidth non plus puisquelle tient compte des bords
		this.element.setStyle('width', isNaN(this.width) ? this.listElement.measure('computedSize', 'x') : this.width);
	},
	
	getOptionValue: function(){
		return '';
	},
			
	open: function(e){
		if( !this.opened && !this.disabled ){
			this.opened = true;
			this.element.addClass('opened');
			this.showListElement();
			this.emit('open', e);
		}
		
		return this;
	},
	
	close: function(e){
		if( this.opened ){
			delete this.opened;
			this.element.removeClass('opened');
			this.hideListElement();
			this.checkChange(e);
			this.emit('close', e);
		}
		return this;			
	},
	
	toggle: function(e){
		return this.opened ? this.close(e) : this.open(e);
	},
	
	enable: function(){
		if( this.disabled ){
			delete this.disabled;
			this.input.setAttribute('tabIndex', 0);
			this.element.removeAttribute('disabled');
			this.eventList.add('mousedown');
			this.emit('enable');
		}
		return this;
	},
	
	disable: function(){
		if( !this.disabled ){
			this.disabled = true;
			this.input.removeAttribute('tabIndex');
			this.element.setAttribute('disabled', 'disabled');
			this.eventList.remove('mousedown');
			this.emit('disable');
		}
		return this;
	},
	
	setValue: function(value){
		if( value != this.value ){
			this.value = value;
			if( this.input ) this.input.innerHTML = value;
			this.emit('update', value);
		}
	},
	
	setSelected: function(option){
		if( this.selected != option ){
			this.selected = option;
			this.setValue(option ? this.getOptionValue(option) : '');
		}
	},
	
	checkChange: function(e){
		if( this.defaultSelected != this.selected ){
			this.emit('change', this.selected, e);
			this.defaultSelected = this.selected;
		}
		// resélectionne l'option par défaut, faut aussi donne le focus pour la navigation clavier
		if( this.defaultSelected ) this.defaultSelected.select(e).focus(e);
	},
	
	mousedown: function(e){
		this.input.focus();
		e.preventDefault();
		if( !this.listElement.contains(e.target) ){
			this.toggle(e);
		}
	},
	
	keydown: function(e){
		if( e.key == 'space' ) this.open(e);
		else if( e.key == 'esc' ) this.close(e);
		this.emit('keydown', e);
	},
	
	blur: function(e){
		this.checkChange(e);
		this.close(e);
	}
});

var SelectorView = new Class({
	Extends: TreeView,
	DOMEvents: {
		// mousemove et pas mouseover puisque par exemple: (la souris est déjà sur un noeud mais une action le désélectionne comme le clavier) 
		mousemove: function(e){
			var node = e.target.toTreenode();
			
			if( node ){		
				node.focus(e);
				node.select(e);
			}
		},
		
		click: function(e){
			var node = e.target.toTreenode();
			if( node ) node.active(e);
		}
	},
	
	initialize: function(tree){
		TreeView.prototype.initialize.call(this, tree);
		
		this.eventList.add('mousemove', 'click');
		
		this.selector = new SelectorElement();
		this.selector.setListElement(this.element);
		this.selector.getOptionValue = function(option){ return option.getHTMLName(); };
		if( !this.selected ) this.select(this.findDefaultSelected());
		this.selector.defaultSelected = this.selected;
		this.selector.on('keydown', function(e){
			this.focused.keynav(e);
		}.bind(this));
		
		// if( options && options.size ) options.maxheight = this.getLine() * options.size + 1;		
	},
	
	destroy: function(){
		this.selector.destroy();
		TreeView.prototype.destroy.call(this);
	},
	
	createElement: function(){
		return new Element('div', {'class': 'tree line vx unselectable'});
	},
	
	findDefaultSelected: function(){
		return this.visibles.find(function(node){ return !node.hasState('disabled') && !node.children.length; });
	}
});

var PopupSelectorView = new Class({
	Extends: ExplorerTreeView,
	DOMEvents: {
		dblclik: function(e){
			var node = e.target.toTreenode();
			if( node ) node.active(e);
		}
	},
	
	initialize: function(tree, options){
		ExplorerTreeView.prototype.initialize.call(this, tree, options);
				
		this.selector = new popupSelectorElement();
		this.selector.popup.on('open', function(e){ if( this.selected ) this.selected.focus(e); }.bind(this));
		this.selector.popup.on('submit', function(e){ if( this.selected ) this.selected.active(e); }.bind(this));
		// popup transfer his focus to the tree
		this.selector.popup.element.on('focus', function(e){ this.element.focus(); }.bind(this));
		// prevent tab navigation because transferring focus incompatible with shift+tab
		this.selector.popup.element.setProperty('tabindex', -1);
		this.selector.popup.element.addClass('unselectable');
		this.selector.popup.fill(this.element);
		
		this.selector.getOptionValue = function(option){ return option.getHTMLName(); };
		if( !this.selected ) this.select(this.findDefaultSelected());
		this.selector.defaultSelected = this.selected;
	},
	
	destroy: function(){
		this.selector.destroy();
		ExplorerTreeView.prototype.destroy.call(this);
	},
	
	findDefaultSelected: SelectorView.prototype.findDefaultSelected
});

var events = {
	rename: function(){
		this.selector.adapt();
	},
	
	adopt: function(){
		this.selector.adapt();
	},
	
	remove: function(){
		this.selector.adapt();
	},
	
	setselected: function(node, e){
		if( !node ) node = this.findDefaultSelected();
		else if( e && e.type == 'mousemove' ) return;
		this.selector.setSelected(node, e);
	},
	
	active: function(node, e){
		node.unactive(e);
		this.selector.setSelected(node, e);
		this.selector.input.focus();
		this.selector.close(e);
	}
};

SelectorView.prototype.on(events);
PopupSelectorView.prototype.on(events);
