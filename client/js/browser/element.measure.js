Object.append(window, {
	getWindow: Function.THIS,
	getDocument: function(){ return this.document; }
});

Element.implement({
	getWindow: function(){ return this.ownerDocument.getWindow(); },
	getDocument: function(){ return this.ownerDocument; }
});

Object.append(document, {
	getWindow: function(){ return window; },
	getDocument: Function.THIS
});

// element measure
(function(){

Function.overloadAxisGetter = function(fn){
	return function(axis){
		if( typeof axis == 'string' ) return fn.apply(this, arguments);
		
		return {
			x: fn.call(this, 'x', axis),
			y: fn.call(this, 'y', axis)
		};
	}
};

/*
Function.overloadSideGetter = function(fn){
	return function(side){
		if( typeof side == 'string' ) return fn.apply(this, arguments);
		
		return {
			left: fn.call(this, 'left'),
			right: fn.call(this, 'right'),
			top: fn.call(this, 'top'),
			bottom: fn.call(this, 'bottom')
		}
	};
};
*/

Element.measurers = {};
Element.defineMeasurer = function(name, measurer){
	Element.measurers[name] = measurer;
	Element.prototype['calc' + name.capitalize()] = Function.overloadAxisGetter(measurer);
};

Element.implement({
	measure: function(name){
		var method = this['calc' + name.capitalize()];
		
		if( typeof method != 'function' ) throw new Error('unknown measurer ' + name);
		
		return method.apply(this, toArray(arguments, 1));
	},
	
	getBorder: function(side){
		return this.getComputedStyle('border-' + side + '-width').toInt() || 0;
	},
	
	getMargin: function(side){
		return this.getComputedStyle('margin-' + side).toInt() || 0;
	}
});

function borderBox(element){
	return element.getComputedStyle('-moz-box-sizing') == 'border-box';
}

var measurers = {
	size: function(axis){
		return this['offset' + (axis == 'x' ? 'Width' : 'Height')];
	},
	
	clientSize: function(axis){
		return this['client' + (axis == 'x' ? 'Width' : 'Height')];
	},
	
	scrollSize: function(axis){
		return this['scroll' + (axis == 'x' ? 'Width' : 'Height')];
	},
	
	scroll: function(axis){
		return this['scroll' + (axis == 'x' ? 'Left' : 'Top')];
	},
	
	offset: function(axis){
		return this['offset' + (axis == 'x' ? 'Left' : 'Top')];
	},
	
	position: function(axis){
		return this.measure('offset', axis) - this.getMargin(axis == 'x' ? 'left' : 'top');
	},
		
	cumulativeScroll: function(axis){
		var element = this.parentNode, scroll = 0;
		
		while(element){
			scroll+= element.measure('scroll', axis);
			element = element.parentNode;
		}
		
		return scroll;
	},
	
	cumulativeOffset: function(axis){
		var element = this, offset = 0;
		
		while(element){
			offset+= element.measure('offset', axis);	
			if( element != this && (Browser.safari || Browser.firefox && !borderBox(element)) ){
				offset+= element.getBorder(axis == 'x' ? 'left' : 'top');
			}
			element = element.offsetParent;
		}
		
		return offset;
	},
	
	cumulativePosition: function(axis, relative){
		var cumulativePosition = this.measure('cumulativeOffset', axis) - this.measure('cumulativeScroll', axis);

		if( relative ) cumulativePosition-= relative.measure('cumulativePosition', axis) + relative.getBorder(axis == 'x' ? 'left' : 'top');
		
		return cumulativePosition;
	}
};

// getOffsets speed improvment
if( 'getBoundingClientRect' in Element.prototype && !Browser.Platform.ios ){
	measurers.offsets = function(axis){
		var html = this.getDocument().documentElement, offset = parseInt(this.getBoundingClientRect()[axis == 'x' ? 'left' : 'top']);
			
		offset+= this.measure('cumulativeScroll', axis);
		if( this.getComputedStyle('position') != 'fixed' ) offset+= html.measure('scroll', axis);
		offset-= html['client' + (axis == 'x' ? 'Left' : 'Top')];
		
		return offset;
	};
}

if( Browser.firefox ){
	measurers.offset = function(axis){
		var offset = this['offset' + (axis == 'x' ? 'Left' : 'Top')], parent = this.parentNode;
		
		if( parent && parent.getComputedStyle('overflow') != 'visible' ){
			offset+= parent.getBorder(axis == 'x' ? 'left' : 'top');
		}
		
		return offset;
	}
}

Object.eachPair(measurers, Element.defineMeasurer, Element);

})();

// document measure
(function(){

document.deployMethod = function(name, method){ document[name] = document.body[name] = document.html[name] = method; };
document.compatElement = !document.compatMode || document.compatMode == 'CSS1Compat' ? document.html : document.body;
document.measurers = {};
document.defineMeasurer = function(name, measurer){
	document.measurers[name] = measurer;
	document.deployMethod('calc' + name.capitalize(), Function.overloadAxisGetter(measurer));
};

var measurers = {
	size: Element.measurers.size.bind(document.compatElement),
	clientSize: Element.measurers.clientSize.bind(document.compatElement),
	
	scrollSize: function(axis){
		return Math.max(
			Element.measurers.scrollSize.call(document.compatElement, axis),
			Element.measurers.scrollSize.call(this.getDocument().body, axis),
			this.measure('clientSize', axis)
		);
	},
	
	scroll: function(axis){
		return this.getWindow()['page' + (axis == 'x' ? 'XOffset' : 'YOffset')];
	},
	
	offset: Function.ZERO,
	cumulativeScroll: Function.ZERO,
	cumulativeOffset: Function.ZERO,
	cumulativePosition: Function.ZERO
};

if( Browser.ie ){
	measurers.scroll = Element.measurers.scroll.bind(document.compatElement);
}

Object.eachPair(measurers, document.defineMeasurer, document);
document.deployMethod('measure', Element.prototype.measure);

})();

// scrollTo, offsetParent, coordinates
(function(){

Element.implement({
	scrollTo: function(x, y){
		this.scrollLeft = x;
		this.scrollTop = y;
		
		return this;
	},
	
	getOffsetParent: function(){
		if( this.getComputedStyle('position') != 'fixed' ){
			try{ return this.offsetParent; }
			catch(e){}
		}
		
		return null;
	},

	getCoordinates: function(element){		
		var
			position = this.measure('cumulativePosition', element)
			size = this.measure('size'),
			obj = {
				left: position.x,
				top: position.y,
				width: size.x,
				height: size.y
			}
		;
		
		obj.right = obj.left + obj.width;
		obj.bottom = obj.top + obj.height;
		
		return obj;
	}
});

Object.eachPair({
	scrollTo: function(x, y){
		this.getWindow().scrollTo(x, y);
		return this;
	},
	getOffsetParent: Function.NULL,
	getCoordinates: Element.prototype.getCoordinates
}, document.deployMethod, document);

// offsetparent fix
(function(){

function isOffset(el){
	return el.getComputedStyle('position') != 'static';
};

function isOffsetStatic(el){
	return isOffset(el) || (/^(?:table|td|th)$/i).test(el.tagName);
};

var element = document.createElement('div'), child = document.createElement('div');

element.style.height = '0';
element.appendChild(child);
if( child.offsetParent === element ){
	Element.implement('getOffsetParent', function(){
		var element = this;
		if( element.getComputedStyle('position') == 'fixed' ) return null;

		var isOffsetCheck = element.getComputedStyle('position') == 'static' ? isOffsetStatic : isOffset;
		while( element = element.parentNode ){
			if( isOffsetCheck(element) ) return element;
		}
		return null;
	});
}

})();

})();
