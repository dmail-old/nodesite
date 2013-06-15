/* global */

var exports = {
	tagName: 'div',
	className: 'selector unselectable',
	value: 'Option1',
	width: 'auto',
	height: 'auto',
	minwidth: 200,
	minheight: 24,
	size: 4,

	getChildElement: function(){
		return this.getDom('root');
	},

	getChildItem: function(){
		return NS.OptionTreeView;
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
};

exports = NS.TreeView.extend(exports);
NS.Selector = exports;
