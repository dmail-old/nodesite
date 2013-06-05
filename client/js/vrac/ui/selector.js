/* global Bound, Emitter */

/*
Cette balise est la balise HTML classique

RAF

FIX

*/

var Selector = new Class({
	html: '\
	<div class="selector">\
		<div class="input" tabindex="0"></div>\
		<div class="tool"><span class="arrow"></span></div>\
	</div>\
	',
	value: '',
	width: 'auto',
	height: 'auto',
	minwidth: 200,
	minheight: 24,
	size: 4,

	initialize: function(tree){
		Bound.prototype.constructor.call(this);

		this.bind('adapt', 'mousedown', 'mouseup', 'keydown', 'blur');

		this.selected = this.defaultSelected = null;
		this.element = this.create();

		this.on('open', this.onopen);
		this.on('close', this.onclose);

		this.treeEvents = {
			rename: this.bound.adapt,
			insert: this.bound.adapt,
			remove: this.bound.adapt,
			select: this.onselect.bind(this),
			active: this.onactive.bind(this),
			enter: function(node){
				if( node.hasState('selected') ) this.setSelected(node);
			}.bind(this),
			leave: function(node){
				if( node == this.selected ){
					if( node == this.defaultSelected ) this.defaultSelected = this.findDefaultSelected();
					this.setSelected(this.defaultSelected);
				}
			}.bind(this)
		};

		this.setTree(tree);
	},

	create: function(){
		var element = this.html.toElement();

		this.input = element.getChild(0);
		this.tool = element.getChild(1);

		element.on('mousedown', this.bound.mousedown);
		this.input.on('keydown', this.bound.keydown);
		this.input.on('blur', this.bound.blur);

		this.emit('create', element);

		return element;
	},

	destroy: function(){
		var element = this.element;

		this.removeTree();
		if( element ){
			delete this.element;
			element.destroy();
			this.emit('destroy', element);
		}

		return this;
	},

	setTree: function(tree){
		this.tree = tree;
		this.tree.addPlugin('drawSelector');

		this.tree.singleSelection = true;
		this.tree.setElement(this.tree.createElement());
		this.tree.element.className = 'tree line vx unselectable';
		this.tree.element.style.visibility = 'hidden';

		this.element.appendChild(this.tree.element);

		this.linkTree();
	},

	removeTree: function(){
		if( this.tree ){
			this.tree.removePlugin('drawSelector');
			delete this.tree;
		}
	},

	linkTree: function(){
		this.tree.on(this.treeEvents);

		this.defaultSelected = this.tree.selecteds[0] || this.findDefaultSelected();
		this.setSelected(this.defaultSelected);
		this.adapt();
	},

	unlinkTree: function(){
		this.tree.off(this.treeEvents);
	},

	getValue: function(){
		return this.value;
	},

	setValue: function(value){
		if( value != this.value ){
			this.value = value;
			if( this.input ) this.input.innerHTML = value;
			this.emit('update', value);
		}
	},

	setOptionValue: function(option){
		this.setValue(option ? option.getHTMLName() : '');
	},

	setSelected: function(option){
		if( this.selected != option ){
			this.selected = option;
			this.setOptionValue(option);
		}
	},

	findDefaultSelected: function(){
		return this.tree.visibles.find(function(node){ return !node.hasState('disabled') && !node.children.length; });
	},

	checkChange: function(e){
		if( this.defaultSelected != this.selected ){
			this.emit('change', this.selected, e);
			this.defaultSelected = this.selected;
		}
	},

	onopen: function(){
		this.adapt();
		this.tree.element.style.visibility = 'visible';
	},

	onclose: function(e){
		this.tree.element.style.visibility = 'hidden';
		this.checkChange(e);
	},

	onselect: function(option, e){
		if( !e || e.type != 'mousemove' ) this.setSelected(option);
	},

	onactive: function(option, e){
		option.unactive(e);
		this.setSelected(option);
		this.close(e);
	},

	adapt: function(){
		this.tree.element.setStyles({
			width: this.width,
			height: this.height,
			minWidth: this.minwidth,
			minHeight: this.minheight
		});

		if( this.size ) this.tree.element.setStyle('maxHeight', this.tree.getLine() * this.size + 1);

		this.element.setStyles({
			// au minimum la balise doit faire la largeur de ses choix
			width: isNaN(this.width) ? this.tree.element.measure('clientSize', 'x') : this.width,
			minWidth: this.minwidth
		});
	},

	open: function(e){
		if( this.opened || this.disabled ) return this;
		this.opened = true;

		// à l'ouverture sélectionne l'option par défaut si elle ne l'est pas
		this.tree.select(this.selected, e);
		this.element.addClass('opened');
		this.emit('open', e);

		return this;
	},

	close: function(e){
		if( !this.opened ) return this;
		delete this.opened;

		this.element.removeClass('opened');
		this.emit('close', e);

		return this;
	},

	enable: function(){
		if( this.disabled ){
			delete this.disabled;
			this.input.setAttribute('tabIndex', 0);
			this.element.removeAttribute('disabled');
			this.element.on('mousedown', this.bound.mousedown);
			this.emit('enable');
		}
	},

	disable: function(){
		if( !this.disabled ){
			this.disabled = true;
			this.input.removeAttribute('tabIndex');
			this.element.setAttribute('disabled', 'disabled');
			this.element.off('mousedown', this.bound.mousedown);
			this.emit('disable');
		}
	},

	focus: function(){

	},

	blur: function(e){
		this.checkChange(e);
		this.close(e);
	},

	mousedown: function(e){
		if( this.tool.contains(e.target) ){
			this.tool.addClass('active');
			document.body.on('mouseup', this.bound.mouseup);
			e.preventDefault(); // pour pas que l'input perde le focus par le keydown sur tool
			this.input.focus();
		}

		if( this.opened ){
			this.close(e);
		}
		else{
			this.open(e);
		}
	},

	mouseup: function(){
		this.tool.removeClass('active');
		document.body.off('mouseup', this.bound.mouseup);
	},

	keydown: function(e){
		if( e.key == 'enter' ){
			if( this.selected ){
				this.selected.active(e);
			}
		}
		else if( e.key == 'space' ){
			this.open(e);
		}
		else if( e.key == 'esc' ){
			this.close(e);
		}
		else{
			this.tree.keydown(e);
		}
	}
});

Selector.implement(Emitter, Bound);
