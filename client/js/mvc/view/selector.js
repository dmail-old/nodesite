/* global View, Controller, NodeController, TreeStructure, TreeTraversal, TreeFinder */

/*
root doit avoir la class vx
*/

View.define('selector', {
	Implements: [TreeStructure, TreeTraversal, TreeFinder],
	tagName: 'div',
	className: 'selector unselectable',
	value: '',
	width: 'auto',
	height: 'auto',
	minwidth: 200,
	minheight: 24,
	size: 4,

	constructor: function NodeView(){
		this.initChildren();
		View.prototype.constructor.call(this);
	},

	oninsertchild: function(child){
		if( this.element ){
			child.insertElement(this.element, child.getNextSibling(), true);
		}
	},

	onremovechild: function(child){
		child.removeElement();
	},

	getChildConstructor: function(){
		return View.views.option;
	},

	getHTML: function(){
		var html = '\
			<div class="input" tabindex="0"></div>\
			<div class="tool"><span class="arrow"></span></div>\
			<ul class="root"></ul>\
		';

		return html;
	},

	getDom: function(className){
		return this.element.getNode(function(child){
			return child.hasClass(className);
		});
	},

	enable: function(){
		if( this.disabled ){
			delete this.disabled;
			this.getDom('input').setAttribute('tabIndex', 0);
			this.element.removeAttribute('disabled');
			this.emit('enable');
		}
	},

	disable: function(){
		if( !this.disabled ){
			this.disabled = true;
			this.getDom('input').removeAttribute('tabIndex');
			this.element.setAttribute('disabled', 'disabled');
			this.emit('disable');
		}
	},

	open: function(e){
		if( !this.opened && !this.disabled ){
			this.opened = true;

			this.adapt();

			// à l'ouverture sélectionne l'option par défaut si elle ne l'est pas
			if( this.selected ) this.selected.select(e);

			this.element.addClass('opened');
			this.emit('open', e);
		}

		return this;
	},

	close: function(e){
		if( this.opened ){
			delete this.opened;

			this.checkChange(e);

			this.element.removeClass('opened');
			this.emit('close', e);
		}

		return this;
	},

	getValue: function(){
		return this.value;
	},

	setValue: function(value){
		if( value != this.value ){
			this.value = value;

			var input = this.getDom('input');
			if( input ) input.innerHTML = value;

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

	adapt: function(){
		var root = this.getDom('root');
		var styles = {
			width: this.width,
			height: this.height,
			minWidth: this.minwidth,
			minHeight: this.minheight
		};

		if( this.size ) styles['maxHeight'] = this.tree.getLine() * this.size + 1;

		root.setStyles(styles);
		this.element.setStyles({
			// au minimum la balise doit faire la largeur de ses choix
			width: isNaN(this.width) ? root.measure('clientSize', 'x') : this.width,
			minWidth: this.minwidth
		});
	}
});
