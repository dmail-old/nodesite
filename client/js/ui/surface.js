/*
---

name: Surface

description: Donne la possibilité de redimensionner et déplacer un élément

le fait de pouvoir le déplacer à la souris passeras ailleurs
box,selectionReactanle n'hériteront plus de surface mais instantieront surface sur leur élément
sera surement renommer transform

NOTE
- le scroll du conteneur (scollWidth, scrollHeight) ne doit pas changer pendant le drag/resize/select
sinon scroll.start - offsetParent.measure('scroll') dans calcDrag est éronné
ce cas peut se présenter lorsque l'élément est responsable des scrollbar du parent, son déplacement modifie alors les scrollbars

TODO
- un style qui se généralise à la page quand on drag (cursor: e-resize par ex)
- event "dragstart", "dragend", "drag", "cancel"
- rétablir distance
- e.shift pendant resize: resize proportionnel

FIX

...
*/

function getAroundMargins(element, axis){
	var sidea = 'left', sideb = 'right';

	if( axis != 'x' ){ sidea = 'top'; sideb = 'bottom'; }

	return element.getMargin(sidea) + element.getMargin(sideb);
}

// retourne le taille de l'espace disponible autour de l'élément (dimension du parent)
Element.defineMeasurer('space', function(axis){
	return this.getOffsetParent().measure('clientSize', axis) - getAroundMargins(this, axis);
});

// retourne la taille de l'espace disponible autour de l'élément zone de scroll comprise (dimension + zone scrollable du parent)
Element.defineMeasurer('scrollSpace', function(axis){
	// getOffsetParent() faut l'appeler ici puisque blink change le offsetParent
	var offsetParent = this.getOffsetParent(), space;

	if( offsetParent ){
		// blink au cas ou cet élément soit responsable d'un scroll
		// this.blink(function(){
		space = offsetParent.measure('scrollSize', axis);
		// });
	}
	else{
		// alert('ici');
		console.log(this);
		space = 0;
	}

	return space - getAroundMargins(this, axis);
});

Element.defineMeasurer('computedSize', function(axis){
	return this.getComputedStyle(axis == 'x' ? 'width' : 'height').toInt() || 0;
});

Element.implement({
	isFocusable: function(){
		return this.href || this.type || this.hasProperty('tabIndex');
	},

	hasFocus: function(){
		return document.activeElement == this && this.isFocusable();
	}
});

String.implement('percentOf', function(number){
	var percent = parseInt(this, 10) || 0;
	return typeof number == 'number' && this.contains('%') ? Math.round(percent * number / 100) : percent;
});

// ça c'est pas vraiment une vue, plus un truc qu'on met sur un élement HTML
// quel qu'il soit mais bon
var exports = NS.viewDocument.define('surface', {
	options: {
		axis: 'xy',
		'step-x': 0,
		'step-y': 0,
		free: false,
		confine: 'offsetParent'
	},
	events: {
		mousedown: function(e){
			if( this.holded ) return;
			this.holded = true;

			this.emit('beforeStart');

			this.handle = e.target;
			this.reset();
			this.mousedownEvent = e;
			this.mode = this.getMode();
			this.space = this.calcSpace();

			//this.bind('mouseup', 'mousemove', 'scrollWhileHolded');

			this.offsetParent.on('scroll', this.bound.scrollWhileHolded);
			document.on({
				mouseup: this.bound.mouseup,
				mousemove: this.bound.mousemove
			});

			if( this.checkPrevent() ){
				if( this.element.isFocusable() ) this.element.focus();
				// évite la selection
				e.preventDefault();
			}

			this.emit('start', e);
		},

		mouseup: function(e){
			if( !this.holded ) return;
			this.holded = false;
			this.handle = null;
			this.reseted = false;
			this.space = null;

			this.offsetParent.off('scroll', this.bound.scrollWhileHolded);
			document.off({
				mouseup: this.bound.mouseup,
				mousemove: this.bound.mousemove
			});

			this.stopScroll();

			this.emit('end', e);
		},

		mousemove: function(e){
			this.mousemoveEvent = e;
			this.drag(e);
			this.emit('drag', e);
		},

		focus: function(e){
			if( this.focused === false ){
				this.focused = true;

				if( !this.holded ){
					this.handle = e.target;
				}
			}
		},

		blur: function(){
			this.focused = false;
		},

		keydown: function(e){
			switch(e.key){
			// cancel: annule le drag par la souris
			case 'esc':
				this.mouseup();
				break;
			// left, right, up, down: on fait comme si on le déplacait avec la souris
			case 'left':
			case 'right':
			case 'up':
			case 'down':
				var name, direction, coef;

				if( e.key == 'left' || e.key == 'right' ){
					name = 'left';
					direction = e.key == 'right' ? 1 : -1;
				}
				else if( e.key == 'up' || e.key == 'down' ){
					name = 'top';
					direction = e.key == 'down' ? 1 : -1;
				}

				coef = this.getStep(name == 'left' ? 'x' : 'y') || 1;
				if( e.shift ){
					e.preventDefault(); // évite la sélection par e.shift + flèche
					coef*= 10;
				}
				direction*= coef;

				this.emit('keydrag', e);
				if( this.set(name, this.get(name) + direction, e) ){
					e.preventDefault();
				}
				break;
			}
		}
	},

	holded: false,
	focused: false,
	reseted: false,
	start: null,
	space: null,

	widthchanged: false,
	heightchanged: false,
	leftchanged: false,
	topchanged: false,

	// TODO
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	width: 0,
	height: 0,

	// sera implementé hors du coeur du code
	resizeList: null,
	minsize: null,
	diffsize: null,

	create: function(){

		this.on('change:width', function(value, now){ this.resizeAlso('x', value - now); });
		this.on('change:height', function(value, now){ this.resizeAlso('y', value - now); });

		return this;
	},

	destroy: function(){
		if( this.holded ) this.mouseup();
		if( this.focused ) this.blur();

		return true;
	},

	getDefaultOption: function(name){
		return this.options[name];
	},

	getOption: function(name){
		return this.hasAttribute('data-' + name) ? this.getAttribute('data-' + name) : this.getDefaultOption(name);
	},

	checkPosition: function(){
		if( this.getStyle('left') == 'auto' ) this.setValue('left', this.element.measure('position', 'x'));
		if( this.getStyle('top') == 'auto' ) this.setValue('top', this.element.measure('position', 'y'));
		if( this.getStyle('position') == 'static' ) this.setStyle('position', 'absolute');
	},

	checkDimension: function(){
		var position = this.getStyle('position'), absolute = position == 'absolute';

		// avoid width: 100% on display block element
		if( !absolute ) this.setStyle('position', 'absolute');

		this.resizeList = this.element.getFirst(function(descendant){
			return descendant.hasProperty('data-autoresize');
		}, null, true);

		var elements = [this.element].concat(this.resizeList), styles = [], i = 0, j = elements.length, element;

		// récupère les dimensions de ces éléments et met les à 'auto'
		i = 0;
		for(;i<j;i++){
			element = elements[i];
			styles.push(element.measure('computedSize', 'x'), element.measure('computedSize', 'y'));
			element.style.width = element.style.height = 'auto';
		}

		// on peut ainsi connaitre la taille naturelle du contenu
		this.minsize = this.element.measure('computedSize');
		this.diffsize = {
			x: this.element.measure('size', 'x') - this.minsize.x,
			y: this.element.measure('size', 'y') - this.minsize.y
		};

		// remet les dimensions normales, ceci permet aussi de fixer les dimensions des éléments qu'on resize
		i = 0;
		for(;i<j;i++){
			element = elements[i];
			element.style.width = styles[i*2] + 'px';
			element.style.height = styles[i*2 + 1] + 'px';
		}

		if( !absolute ) this.setStyle('position', position);
	},

	resizeAlso: function(axis, add){
		if( this.resizeList ){
			this.resizeList.forEach(function(element){
				element.style[axis == 'x' ? 'width' : 'height'] = element.measure('computedSize', axis) + add + 'px';
			});
		}
	},

	reset: function(){
		this.reseted = true;
		this.overflow = {x: 0, y: 0};

		this.checkPosition();
		this.checkDimension();

		this.offsetParent = this.element.getOffsetParent();
		if( !this.offsetParent || this.offsetParent == document.html || this.offsetParent == document.body ){
			this.offsetParent = document;
		}
		this.scroller.attach(this.offsetParent);

		this.start = {
			left: this.getLeft(),
			top: this.getTop(),
			scrollx: this.offsetParent.measure('scroll', 'x'),
			scrolly: this.offsetParent.measure('scroll', 'y')
		};

		// if( this.mode == 'resize' ){
		this.start.width = this.getWidth();
		this.start.height = this.getHeight();
		// }
	}
});

Object.append(exports, {
	get: function(name){
		return this.getStyle(name).toInt() || 0;
	},

	setValue: function(name, value){
		this.element.style[name] = value + 'px';
		return this;
	},

	getStep: function(axis){
		return this.getOption('step-' + axis);
	},

	toStep: function(axis, value){
		var step = this.getStep(axis);
		if( step ) value = Math.floor(value / step) * step;
		return value;
	},

	toValue: function(name, value){
		if( typeof value == 'function' ) value = value.call(this);
		if( typeof value == 'string' ){
			if( value.contains('%') ){
				value = value.percentOf(this.element.measure('space', name == 'width' || name == 'left' ? 'x' : 'y'));
			}
			else{
				value = parseInt(value, 10) || 0;
			}
		}

		if( typeof value != 'number' ) value = null;
		else value = this.toStep(name == 'width' || name == 'left' ? 'x' : 'y', value);

		return value;
	},

	checkValue: function(name, value){
		// laisser les deux vérifs au cas ou maximum < minimum
		value = Math.min(value, this.getLimit(name, 'max'));
		value = Math.max(value, this.getLimit(name, 'min'));

		return value;
	},

	// déplace ou resize
	set: function(name, value, e, ignoreOverflow){
		if( !this.reseted ) this.reset();

		value = this.toValue(name, value);
		if( value === null ) return false;
		value = this.checkValue(name, value);

		var now = this.get(name);
		// que ici parceque toValue et checkValue change value
		if( value == now ) return false;

		this.setValue(name, value);

		this[name + 'changed'] = value;

		this.emit('change:' + name, value, now, e);
		this.emit('change', name, value, now, e);

		// emit change event only one time
		if( this.updateOnce ) window.clearImmediate(this.updateOnce);
		this.updateOnce = window.setImmediate(function(){

			this.updateOnce = null;

			this.emit('update', e);
			this.widthchanged = false;
			this.heightchanged = false;
			this.leftchanged = false;
			this.topchanged = false;

		}.bind(this));

		return true;
	},

	// déplace et resize en même temps
	extendTo: function(axis, value, e){
		if( !this.reseted ) this.reset();

		var
			position = axis == 'x' ? 'left' : 'top',
			dimension = axis == 'x' ? 'width' : 'height',
			move = value - this.get(position),
			now, propertyA, propertyB,
			increase = move < 0
		;

		// j'augmente la taille donc je commence par déplacer
		if( increase ){
			propertyA = position;
			propertyB = dimension;
		}
		// je diminue la taille donc je commence par resizer
		else{
			move = -move;
			propertyA = dimension;
			propertyB = position;
		}

		now = this.get(propertyA);
		if( this.set(propertyA, now + move, e, true) ){
			this.set(propertyB, this.get(propertyB) - (this.get(propertyA) - now), e, true);
			return true;
		}
		return false;
	},

	move: function(left, top, e){
		this.set('left', left, e);
		this.set('top', top, e);
		return this;
	},

	resize: function(width, height, e){
		this.set('width', width, e);
		this.set('height', height, e);
		return this;
	}
});

Object.append(exports, {
	calcSpace: function(axis){
		return this.element.measure('scrollSpace', axis);
	},

	getSpace: function(axis){
		return this.space ? this.space[axis] : this.calcSpace(axis);
	},

	calcLimit: function(name){
		switch(name){
		case 'minleft':
		case 'mintop':
			return 0;
		case 'maxleft':
		case 'maxwidth':
			return this.getSpace('x');
		case 'maxtop':
		case 'maxheight':
			return this.getSpace('y');
		case 'minwidth':
			return Math.min(this.minsize.x, document.measure('clientSize', 'y'));
		case 'minheight':
			return Math.min(this.minsize.y, document.measure('clientSize', 'x'));
		default:
			return 0;
		}
	},

	getLimit: function(name, minmax){
		if( this.getOption('free') ) return Infinity;

		var limit = this.calcLimit(minmax + name);
		var optionLimit = this.getOption(minmax + name);
		var axis = name == 'width' || name == 'left' ? 'x' : 'y';

		if( typeof optionLimit == 'string' ){
			if( optionLimit.contains('%') ){
				// percentof de la zone disponible
				optionLimit = optionLimit.percentOf(this.element.measure('space', axis));
			}
			else{
				optionLimit = parseInt(optionLimit, 10) || null;
			}
		}

		if( typeof limit == 'number' && typeof optionLimit == 'number' ){
			limit = Math[minmax == 'min' ? 'max' : 'min'](limit, optionLimit);
		}

		if( minmax == 'max' ){
			if( name == 'width' || name == 'height' ){
				limit-= this.get(name == 'width' ? 'left' : 'top');
				// limit-= this.element.measure('position', name == 'width' ? 'x' : 'y');
				limit-= this.diffsize[name == 'width' ? 'x' : 'y'];
			}
			else{
				limit-= this.element.measure('size', name == 'left' ? 'x' : 'y');
			}
		}

		return limit;
	},

	// retourne de combien on a bougé en axis d'après la position de la souris et du scroll
	calcDrag: function(axis){
		var a = this.mousedownEvent.client[axis], b = this.mousemoveEvent.client[axis];

		a+= this.start['scroll' + axis];
		b+= this.offsetParent.measure('scroll', axis);

		return b - a;
	},

	canDrag: function(axis){
		var option = this.getOption('axis');
		return !option || option == axis || option == 'xy';
	},

	drag: function(e){
		if( this.canDrag('x') ) this.updateDrag('x', this.calcDrag('x'), e);
		if( this.canDrag('y') ) this.updateDrag('y', this.calcDrag('y'), e);
	},

	updateDrag: function(axis, value, e){
		var name;

		switch(this.mode){
		case 'move':
			name = axis == 'x' ? 'left' : 'top';
			return this.set(name, this.start[name] + value, e);
		case 'resize':
			// on resize gauche ou haut (resize + move)
			if( this.resizer.contains(axis == 'x' ? 'w' : 'n') ){
				name = axis == 'x' ? 'left' : 'top';
				return this.extendTo(axis, this.start[name] + value, e);
			}
			// on resize droite ou bas (resize)
			else if( this.resizer.contains(axis == 'x' ? 'e' : 's') ){
				name = axis == 'x' ? 'width' : 'height';
				return this.set(name, this.start[name] + value, e);
			}
			// sinon le resize n'est pas permis
			return false;
		default:
			return false;
		}
	}
});

// mousedown, mouseup, mousemove, focus, blur, scroll, keydown
Object.append(exports, {
	getMode: function(axis){
		if( this.handle && this.handle.hasClass('vector') ){
			this.resizer = this.handle.getStyle('cursor').substr(0, 2);
			return 'resize';
		}

		return 'move';
	},

	checkPrevent: Function.TRUE,

	scrollWhileHolded: function(e){
		this.drag(e);
	}
});

// crée ou retourne une instance existante pour cet élément
exports.retrieveInstance = function(e){
	var instance, forId, element;

	if( e.target instanceof Element ){
		if( e.target.getProperty('data-draggable') ){
			forId = e.target.getProperty('data-for') || e.target.getProperty('for');
			element = forId ? $(forId) : e.target;

			if( element ) instance = NS.Surface.new(element, true);
		}
		else if( e.target.hasClass('vector') ){
			forId = e.target.getProperty('data-for') || e.target.getProperty('for');
			element = forId ? $(forId) : e.target.parentNode;

			if( element ) instance = NS.Surface.new(element, true);
		}
		else if( e.type == 'keydown' && e.target.hasClass('selectionRectangle') ){
			element = e.target;

			if( element ) instance = NS.Surface.new(element, true);
		}
	}

	return instance;
};

//document.on('mousedown focus keydown', exports.startInstanceFromEvent, true);

['left', 'top', 'width', 'height'].forEach(function(name){
	exports['getMin' + name.capitalize()] = exports.getLimit.curry(name, 'min');
	exports['getMax' + name.capitalize()] = exports.getLimit.curry(name, 'max');
	exports['get' + name.capitalize()] = exports.get.curry(name);
	exports['set' + name.capitalize()] = exports.set.curry(name);
});

// scroll handling
Object.append(exports, {
	options: Object.append(exports.options, {
		scrollAuto: true,
		scrollDelay: 100,
		scrollDuration: 100,
		scrollOffset: 0,
		scrollReference: 'element',
		scrollStep: 30
	}),
	scrollTimeout: null,
	scroller: null,
	overflow: null,
	prevright: 0,
	prevbottom: 0,

	create: function(){
		this.scroller = NS['Fx.Scroll'].new({
			link: 'ignore',
			transition: 'linear',
			wheelStops: true,
			step: this.getOption('scrollStep'),
			duration: this.getOption('scrollDuration')
		});
		// le scroller relanceras le scroll tant qu'il y a besoin
		this.scroller.on('complete', this.startScroll.bind(this));

		this.on('update', function(e){

			if( this.widthchanged || this.leftchanged ){
				this.updateOverflow('x', this.prevright > this.right ? 1 : -1, e);
				this.prevright = this.right;
			}

			if( this.heightchanged || this.topchanged ){
				this.updateOverflow('y', this.prevbottom > this.bottom ? 1 : -1, e);
				this.prevbottom = this.bottom;
			}

			this.checkScroll();
		});
	},

	// on essaye de conserver l'élément visible à chaque fois qu'il se déplace
	updateOverflow: function(axis, direction, e){
		if( !this.getOption('scrollAuto') ) return;

		// on autoscroll pas sur un changement induit par un scroll
		if( e && e.type == 'scroll' ) return;

		var
			reference = this.holded ? this.getOption('scrollReference') : 'element',
			offsetParent = this.element.offsetParent,
			value, border, overflow
		;

		// on regarde si le curseur est hors de la zone de drag
		if( reference == 'mouse' ){
			value = this.mousemoveEvent.client[axis];
			border = offsetParent.measure('cumulativeOffset', axis);

			if( value > border ){
				direction = 1;
				border+= offsetParent.measure('clientSize', axis);
			}
			else{
				direction = -1;
			}
		}
		// on regarde si l'élément est hors de la zone visible
		else if( reference == 'element' ){
			value = this.get(axis == 'x' ? 'left' : 'top');
			border = offsetParent.measure('scroll', axis);

			if( direction == 1 ){
				value+= this.element.measure('size', axis);
				border+= offsetParent.measure('clientSize', axis);
			}
			else{
				direction = -1;
			}
		}

		// on tient compte de la précision du scroll
		// value+= this.getOption('scrollOffset') * direction;
		overflow = value - border;
		if( overflow * direction < 0 ) overflow = 0;

		this.overflow[axis] = overflow;
	},

	checkScroll: function(){
		// on arrête le scroll que si aucun des deux axes n'a besoin de scroll
		if( this.overflow.x === 0 && this.overflow.y === 0 ){
			this.stopScroll();
		}
		else if( this.holded ){
			// si on est pas en train de scroller on lance le scroll maintenant ou le scroll retardé
			// si aucun scroll en attente, ou démarre le scroll
			// (soit dès qu'on a fini les actions en cours scrollDelay = 0, soit avec scrollDelay
			if( !this.scrollTimeout && !this.scroller.isRunning() ){
				var delay = this.getOption('scrollDelay');
				if( delay ){
					this.scrollTimeout = setTimeout(this.startScroll.bind(this), delay);
				}
				else{
					this.startScroll();
				}
			}
		}
		else{
			this.scroller.add(this.overflow.x, this.overflow.y);
		}
	},

	startScroll: function(){
		this.scrollTimeout = null;
		this.scroller.startAdd(this.overflow.x || 0, this.overflow.y || 0);
	},

	stopScroll: function(){
		if( this.scroller ){
			if( this.scrollTimeout ){
				clearTimeout(this.scrollTimeout);
				this.scrollTimeout = null;
			}
			this.scroller.cancel();
		}
	}
});

NS.Surface = exports.supplement(NS.EmitterInterface);

// TODO: distance handling
// var drag = Surface.prototype.drag;

// Surface.implement({
//	options: {
//		distance: 6
//	},

//	// retourne si le déplacement est suffisant pour démarrer
//	checkDistance: function(x, y){
//		x-= this.start.left;
//		y-= this.start.top;

//		return Math.round(Math.sqrt(x*x + y*y)) > this.getOption('distance');
//	},

//	// ne déplace que si la distance minimum est parcourue (uniquement en mode mousemove)
//	drag: function(x, y, e){
//		if( !this.running && e && e.type == 'mousemove' ){
//			if( !this.checkDistance(x, y) ) return false;
//			this.running = true;
//		}

//		return drag.apply(this, arguments);
//	}
//});
