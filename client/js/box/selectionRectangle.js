/*On va commencer par faire le sélecteur RPG maker VX pour que toutes les options soient làTODOFIX*/var SelectionRectangle = new Class({	Extends: DOMRectangle,	Implements: [Options],		options: {		step: 0,		disabled: false,		visible: false,		focusable: true,		addmousedown: true	},		initialize: function(container, options){		this.setOptions(options);		this.element = this.createElement();				container.appendChild(this.element);		if( this.options.addmousedown ) container.on('mousedown', this.bind('mousedown'));				if( !this.options.visible ) this.hide();		this.on('end', function(){ if( !this.options.visible ) this.hide(); });		/*		this.on('update', function(name, value, old, e){			if( name == 'width' || name == 'height' ){				this.element.style.visibility = value < this.diffsize[name == 'width' ? 'x' : 'y'] ? 'hidden' : 'visible';			}		});		*/				DOMRectangle.prototype.initialize.call(this, this.element);				// this.resize(this.options.step, this.options.step);		// this.move(this.options.step, this.options.step);	},		destroy: function(){		DOMRectangle.prototype.destroy.call(this);		this.element.destroy();	},		createElement: function(){		var element = new Element('div', {'class': 'selectionRectangle'});				if( this.options.focusable ){			element.setProperty('tabindex', 0);		}		if( this.options.step ){			element.setProperty('data-step-x', this.options.step);			element.setProperty('data-step-y', this.options.step);			element.setProperty('data-scrollStep', this.options.step);		}				return element;	},		mousedown: function(e){		if( !this.options.visible ) this.show();				var x = this.getRelativeCoord('x', e.page.x), y = this.getRelativeCoord('y', e.page.y);				// mousedown sur la scrollbar		if( x >= this.element.parentNode.measure('scrollSize', 'x') || y >= this.element.parentNode.measure('scrollSize', 'y') ){			if( !this.options.visible ) this.hide();			return;		}				this.setOrigin(x, y, e);						DOMRectangle.prototype.mousedown.call(this, e);	},		getRelativeCoord: function(axis, value){		var offsetParent = this.element.getOffsetParent();				return value - offsetParent.measure('cumulativeOffset', axis) + offsetParent.measure('scroll', axis);	},		calcDrag: function(axis){		var value = this.toStep(axis, this.getRelativeCoord(axis, this.mousemoveEvent.page[axis]));						// $('origin').innerHTML = this.start.left + ',' + this.start.top;		// $('mouse' + axis).innerHTML = value;				return value;	},		/*	calcLimit: function(name){		switch(name){			case 'minleft': case 'mintop': return 1;			case 'maxleft': case 'maxwidth': return this.getScrollSpace('x') - 1;			case 'maxtop': case 'maxheight': return this.getScrollSpace('y') - 1;			case 'minwidth': return 0;			case 'minheight': return 0;			default: return 0;		}		},	*/		updateDrag: function(axis, value, e){		var			position = axis == 'x' ? 'left' : 'top',			dimension = axis == 'x' ? 'width' : 'height',			start = this.start[position],			direction = this.mousemoveEvent.page[axis] < this.mousedownEvent.page[axis] ? -1 : 1,			pos, size		;				value = Math.max(value, 0);		value = Math.min(value, this.offsetParent.measure('scrollSize', axis));				size = value - start;		pos = start;				if( size < 0 ){			size = -size;			pos-= size;		}				size+= this.start[dimension] + this.diffsize[axis];				// $('position' + axis).innerHTML = pos;		// $('size' + axis).innerHTML = size;				if( size > this.get(dimension) + this.diffsize[axis] ){			this.set(position, pos, e, true);			this.set(dimension, size, e, true);		}		else{			this.set(dimension, size, e, true);			this.set(position, pos, e, true);		}				// lance toujours updateOverflow puisque la souris peut sortir		this.updateOverflow(axis, direction, e);	},		checkValue: function(name, value){		// on enlève padding+border pour que le sélecteur fasse la vrai taille désirée		if( name == 'width' || name == 'height' ) value-= this.diffsize[name == 'width' ? 'x' : 'y'];		return DOMRectangle.prototype.checkValue.call(this, name, value);			},			setOrigin: function(x, y, e){		this.origin = {x: x, y: y};					// resize avant sinon on peut pas déplacer, les limites étant atteinte		this.resize(this.options.step, this.options.step);		this.move(x, y, e);				return this;	},				hide: function(){		this.element.setStyle('display', 'none');		return this;	},		show: function(){		this.element.setStyle('display', 'block');		return this;	}});