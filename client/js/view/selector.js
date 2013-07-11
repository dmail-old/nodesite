NS.viewDocument.define('selector', NS.View.extend({
	template: '\
		<div class="selector unselectable">\
			<div class="input" tabindex="0">\
				<span class="value">{value}</span>\
				<div class="tool">\
					<span class="arrow"></span>\
				</div>\
			</div>\
			<ul class="root vx"></ul>\
		</div>\
	',

	size: 4,
	options: {
		width: 'auto',
		height: 'auto',
		minwidth: 200,
		minheight: 24
	},

	create: function(){
		NS.View.create.apply(this, arguments);

		this.on({
			'insertElement': this,
			'removeElement': this,
			'open': this
		});

	},

	handleEvent: function(name, args){
		if( name == 'insertElement' || name == 'removeElement' || name == 'open' ){
			this.adapt();
		}
	},

	getChildrenElement: function(){
		return this.getDom('root');
	},

	getDom: function(className){
		return this.element.getFirst(function(child){
			return child.hasClass(className);
		});
	},

	enable: function(){
		if( this.hasClass('disabled') ){
			this.getDom('input').setAttribute('tabIndex', 0);
			this.removeClass('disabled');
			this.emit('enable');
		}
	},

	disable: function(){
		if( !this.hasClass('disabled') ){
			this.getDom('input').removeAttribute('tabIndex');
			this.addClass('disabled');
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

		if( isNaN(this.width) ) this.width = root.measure('clientSize', 'x');

		root.setStyles(styles);
		// au minimum la balise doit faire la largeur de ses choix
		this.setStyle('width', this.width);
		this.setStyle('minWidth', this.minwidth);
	}
}));
