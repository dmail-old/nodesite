/*
---

name: Box

description: Crée un élément HTML manipulable

NOTE:

TODO:

FIX:

...
*/

NS.Box = NS.Surface.extend(NS.options, {
	template: '<div class="box small" tabindex="0">Hello World</div>',
	options: Object.extendMerge(NS.Surface.options, {
		scrollReference: 'element',
		minwidth: 0,
		minheight: 0,

		draggable: true,
		resizable: true,
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
	}),
	styles: {
		position: 'absolute',
		zIndex: 100,
		width: 'auto',
		height: 'auto',
		left: 0,
		top: 0,
	},

	ideal: null,
	empty: false,

	create: function(){

		NS.Surface.create.apply(this, arguments);

		if( this.options.echapclose ){
			this.elementEmitter('keydown', function(e){
				if( e.code == 27 ){
					e.preventDefault();
					this.close(e);
				}
			});
		}
		if( this.options.blurclose ) this.elementEmitter.on('blur', this.close);
		if( this.options.closedestroy ) this.on('close', this.destroy);

		this.ideal = {};

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

		// if( this.options.resizable ) element.wrapVectors();
		// if( this.options.draggable ) element.on('mousedown', this.mousedown.bind(this));

		this.element.style.display = 'none';	
		
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
			this.fx = NS.FxMorph.new(this.frame, fx.options).start(fx.styles);
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
		(this.element.getFirst(function(element){ return element.hasProperty('data-autofocus'); }) || this.element).focus();

		this.windowEmitter.on('resize', this.respect);

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

		this.windowEmitter.off('resize', this.respect);

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
			this.addClass('focus');
			this.setStyle('zIndex', 100);
			this.constructor.active = this;
			this.emit('focus', e);
		}

		return this;
	},

	blur: function(e){
		if( this.focused ){
			this.focused = false;

			// évite que le focus d'un élément de la boite ne déclenche blur
			window.setImmediate(function(){
				if( !this.focused ){
					this.removeClass('focus');
					this.setStyle('zIndex', 99);
					this.constructor.active = null;

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

// retourne la taille de l'espace visible disponible pour cet élément (dimension + scroll du parent)
Element.defineMeasurer('fixedSpace', function(axis){
	return this.measure('space', axis) + this.getOffsetParent().measure('scroll', axis);
});
