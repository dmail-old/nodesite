/* global View, Controller, NodeController, TreeStructure, TreeTraversal, TreeFinder */

View.extend('selector', {
	Implements: [TreeStructure, TreeTraversal, TreeFinder],
	tagName: 'div',
	className: 'selector unselectable',
	value: 'Option1',
	width: 'auto',
	height: 'auto',
	minwidth: 200,
	minheight: 24,
	size: 4,

	constructor: function(){
		this.initChildren();
		View.prototype.constructor.call(this);
	},

	oninsertchild: function(child){
		var childElement = this.getChildElement();

		if( childElement ){
			child.insertElement(childElement, child.getNextSibling(), true);
		}
	},

	onremovechild: function(child){
		child.removeElement();
	},

	getChildElement: function(){
		return this.getDom('root');
	},

	getChildConstructor: function(){
		return View.views.option;
	},

	getHTML: function(){
		var html = '\
			<div class="input" tabindex="0">\
				<span class="value">'+ this.value +'</span>\
				<div class="tool">\
					<span class="arrow"></span>\
				</div>\
			</div>\
			<ul class="root vx"></ul>\
		';

		return html;
	},

	getDom: function(className){
		return this.element.getNode(function(child){
			return child.hasClass(className);
		});
	},

	enable: function(){
		if( this.hasClass('disabled') ){
			this.getDom('input').setAttribute('tabIndex', 0);
			this.element.removeClass('disabled');
			this.emit('enable');
		}
	},

	disable: function(){
		if( !this.hasClass('disabled') ){
			this.getDom('input').removeAttribute('tabIndex');
			this.element.addClass('disabled');
			this.emit('disable');
		}
	},

	open: function(e){
		if( !this.hasClass('opened') && !this.hasClass('disabled') ){
			this.addClass('opened');
			this.emit('open', e);
		}

		return this;
	},

	close: function(e){
		if( this.hasClass('opened') && !this.hasClass('disabled') ){
			this.removeClass('opened');
			this.emit('close', e);
		}

		return this;
	},

	toggle: function(e){
		if( this.hasClass('opened') ){
			this.close(e);
		}
		else{
			this.open(e);
		}
	},

	getValue: function(){
		return this.getDom('value').innerHTML;
	},

	setValue: function(value){
		if( value != this.getValue() ){
			this.getDom('value').innerHTML = value;
			this.emit('update', value);
		}
	},

	setOptionValue: function(option){
		this.setValue(option ? option.getHTMLName() : '');
	},

	adapt: function(){
		var root = this.getDom('root');
		var styles = {
			width: this.width,
			height: this.height,
			minWidth: this.minwidth,
			minHeight: this.minheight
		};

		//if( this.size ) styles['maxHeight'] = this.tree.getLine() * this.size + 1;

		root.setStyles(styles);
		this.element.setStyles({
			// au minimum la balise doit faire la largeur de ses choix
			width: isNaN(this.width) ? root.measure('clientSize', 'x') : this.width,
			minWidth: this.minwidth
		});
	}
});
