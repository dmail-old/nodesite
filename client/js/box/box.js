/* global Options */

/*
---

name: Box

description: Iteme qui crée une boîte manipulable

NOTE:

TODO:

FIX:

...
*/

// retourne la taille de l'espace visible disponible pour cet élément (dimension + scroll du parent)
Element.defineMeasurer('fixedSpace', function(axis){
	return this.measure('space', axis) + this.getOffsetParent().measure('scroll', axis);
});

Item.extend('domrectangle', 'box', 'options', {
	options: {
		tagName: 'div',
		properties: {
			html: 'Hello world',
			'class': 'box small',
			'data-scrollReference': 'element',
			tabindex: 0
		},
		draggable: true,
		resizable: true,
		position: 'absolute',
		zIndex: 100,
		width: 'auto',
		height: 'auto',
		minwidth: 0,
		minheight: 0,
		left: 0,
		top: 0,
		// on essaye de respecter la position qu'on calcule au départ
		fixPosition: true,
		// on recalcule les dimensions à chaque fois (on respecte le pourcentage)
		fixDimension: false,
		echapclose: true,
		blurclose: false,
		closedestroy: false,
		fx: {
			open: false,
			close: false
		}
	},

	constructor: function(options){
		this.setOptions(options);

		if( this.options.echapclose ) this.on('keydown', function(e){ if( e.code == 27 ){ e.preventDefault(); this.close(e); } });
		if( this.options.blurclose ) this.on('blur', this.close);
		if( this.options.closedestroy ) this.on('close', this.destroy);

		this.bind('open', 'close', 'respect', 'focus', 'blur', 'keydown');
		this.constructor.instances[this.id = this.constructor.UID++] = this;
		Item('domrectangle').constructor.call(this, this.createElement());
	},

	createElement: function(){
		var element = new Element(this.options.tagName, this.options.properties);

		// lorsqu'on déplace ou resize manuellement la boîte, cette valeur devient la valeur idéale
		this.on('change', function(name, value, current, e){
			if( e && e.type != 'resize' ) this.ideal[name] = value;
		});

		/*
		permet de corriger ceci:

		reste que si une scrollbar apparait à droite puisque j'appele respect
		je resize dabord en largeur, je tient compte de la scrollbar en donc la largeur disponible est diminuée de 17pixel
		hors le resize en hauteur va supprimer la scrollbar en largeur et je peut donc remettre 17 pixel en largeur
		*/
		// lorsqu'on resize la boite en hauteur depuis un event resize on resize aussi la boite en largeur
		this.on('change:height', function(value, current, e){
			if( e && e.type == 'resize' ) this.setWidth(this.getIdeal('width'), e);
		});

		if( this.options.resizable ) element.wrapVectors();
		if( this.options.draggable ) element.on('mousedown', this.mousedown.bind(this));
		if( this.options.minwidth ) element.setProperty('data-minwidth', this.options.minwidth);
		if( this.options.minheight ) element.setProperty('data-minheight', this.options.minheight);

		element.on('focus', this.bound.focus, true);
		element.on('blur', this.bound.blur, true);
		element.on('keydown', this.bound.keydown);
		element.setProperty('id', 'box-' + this.id);
		// element.setStyle('zIndex', this.options.zIndex);
		element.setStyle('position', this.options.position);
		element.style.display = 'none';

		this.ideal = {};

		return element;
	},

	destroy: function(){
		this.element.destroy();
		delete this.constructor.instances[this.id];
		Item('domrectangle').destroy.call(this);
	},

	removeAll: function(){
		var container = this.getContainer();

		Array.prototype.forEach.call(container.childNodes, function(child){
			if( this.options.resizable && child instanceof Element && child.hasClass('vector') ) return;
			container.removeChild(child);
		}, this);
	},

	getContainer: function(){
		return this.element;
	},

	clean: function(){
		if( !this.empty ){
			this.empty = true;
			this.removeAll();
			this.emit('clean');
		}
		return this;
	},

	updateContent: function(){
		if( this.opened ){
			this.reset();
			this.respect();
		}
	},

	fill: function(element){
		this.clean();

		var container = this.getContainer();

		if( typeof element == 'string' ) container.innerHTML = element;
		else if( element instanceof Element ) container.appendChild(element);
		else if( element instanceof Array ) container.adopt.apply(container, element);

		delete this.empty;
		this.ideal = {};
		this.updateContent();

		return this.emit('fill');
	},

	effect: function(name, noeffect, callback){
		var fx = this.options.fx[name];

		if( noeffect || !fx ) callback.call(this);
		else{
			fx.options.onComplete = callback.bind(this);
			if( this.fx ){ this.fx.cancel(); }
			this.fx = Item.create('fx.morph', this.frame, fx.options).start(fx.styles);
		}
		return this;
	},

	open: function(noeffect){
		if( this.opened ) return this;
		if( !this.element.parentNode ) document.body.appendChild(this.element);

		this.emit('beforeopen');
		this.opened = true;

		this.element.style.display = 'block';

		this.reset();
		this.respect();

		// focus uniquement après respect pour ne pas que le focus lance un scroll si la popup est hors champ
		this.beforeOpenActiveElement = document.activeElement;
		(this.element.getElement(function(element){ return element.hasProperty('data-autofocus'); }) || this.element).focus();

		window.on('resize', this.bound.respect);

		return this.effect('open', noeffect, this.emit.bind(this, 'open'));
	},

	close: function(noeffect){
		if( !this.opened ) return this;
		this.opened = false;

		// redonne le focus à l'élément qui l'avait à l'ouverture de la popup lorsqu'elle se ferme
		if( this.focused ){
			this.beforeOpenActiveElement.focus();
			delete this.beforeOpenActiveElement;
		}

		window.off('resize', this.bound.respect);

		return this.effect('close', noeffect, function(){
			this.element.style.display = 'none';
			this.emit('close');
		});
	},

	getIdeal: function(name){
		var value;

		if( name in this.ideal ){
			value = this.ideal[name];
		}
		else{
			value = this.toValue(name, this.options[name]);
			if( this.options[name == 'width' || name == 'height' ? 'fixDimension' : 'fixPosition'] ) this.ideal[name] = value;
		}

		return value;
	},

	place: function(e){
		this.move(this.getIdeal('left'), this.getIdeal('top'), e, false);
		this.emit('place', e);
		return this;
	},

	adapt: function(e){
		this.resize(this.getIdeal('width'), this.getIdeal('height'), e, false);
		this.emit('adapt', e);
		return this;
	},

	respect: function(e){
		if( this.opened ){
			this.adapt(e);
			this.place(e);
		}
		return this;
	},

	calcSpace: function(axis){
		return this.element.measure('fixedSpace', axis);
	},

	calcPositionSpacePercent: function(axis, percent){
		var position = (this.element.measure('space', axis) - this.element.measure('size', axis)) * percent;

		return Math.round(position + this.element.offsetParent.measure('scroll', axis));
	},

	center: function(axis){
		var x = false, y = false;

		if( !axis ) x = y = true;
		else if( axis == 'x' ) x = true;
		else if( axis == 'y' ) y = true;

		if( x )	this.setLeft(this.calcPositionSpacePercent('x', 0.5));
		if( y ) this.setTop(this.calcPositionSpacePercent('y', 0.5));

		return this;
	},

	focus: function(e){
		if( !this.focused ){
			this.focused = true;
			this.element.addClass('focus');
			this.element.setStyle('zIndex', 100);
			this.constructor.active = this;
			this.emit('focus', e);
		}

		return this;
	},

	blur: function(e){
		if( this.focused ){
			delete this.focused;

			// évite que le focus d'un élément de la boite ne déclenche blur
			window.setImmediate(function(){
				if( !this.focused ){
					this.element.removeClass('focus');
					this.element.setStyle('zIndex', 99);
					delete this.constructor.active;

					this.emit('blur', e);
				}
			}.bind(this));
		}

		return this;
	},

	keydown: function(e){
		this.emit('keydown', e);
	}
});

var Box = Item('domrectangle.box');

Box.UID = 0;
Box.instances = [];
// contient la boite en cours d'utilisation (focused)
Box.active = null;

Box.getInstanceFromElement = function(element){
	var id;

	while(element){
		id = element.getProperty('id');
		if( id && id.startsWith('box-') ){
			return Box.instances[id.substr(4)];
		}
		element = element.parentNode;
	}

	return null;
};
