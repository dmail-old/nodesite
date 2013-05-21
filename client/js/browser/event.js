Object.defineAlias = function(object, nameA, nameB){
	Object.defineProperty(object, nameB, {
		'get': function(){
			return this[nameA];
		}		
	});
};
Object.defineAlias(Event.prototype, 'shiftKey', 'shift');
Object.defineAlias(Event.prototype, 'ctrlKey', 'control');
Object.defineAlias(Event.prototype, 'altKey', 'alt');
Object.defineAlias(Event.prototype, 'metaKey', 'meta');

/*
Object.defineProperty(Event.prototype, 'target', {
	get: function(){
		var target = this.target || this.srcElement;
		while( target && target.nodeType == 3 ) target = target.parentNode;
		return target;
	}
});

Object.defineProperty(Event.prototype, 'relatedTarget', {
	get: function(){
		if( this.type == 'mouseover' || this.type == 'mouseout' ){
			var related = this.relatedTarget || this[(this.type == 'mouseover' ? 'from' : 'to') + 'Element'];
			while( related && related.nodeType == 3 ) related = related.parentNode;
			return related;
		}
	}
});
*/

Object.defineProperty(Event.prototype, 'rightClick', {
	get: function(){
		return this.which == 3 || this.button == 2;
	}
});

Object.defineProperty(Event.prototype, 'wheel', {
	get: function(){
		if( this.type == 'DOMMouseScroll' || this.type == 'mousewheel' ){
			return this.wheelDelta ? this.wheelDelta / 120 : -(this.detail || 0) / 3;
		}
		return undefined;
	}
});

Object.defineProperty(Event.prototype, 'page', {
	get: function(){
		var page = {};
		
		if( this.touches && this.touches[0] && (this.type.indexOf('touch') == 0 || this.type.indexOf('gesture') == 0) ){
			page = {
				x: this.touches[0].pageX,
				y: this.touches[0].pageY
			}
		}		
		else if( this.type == 'click' || this.type == 'dblclick' || this.type == 'contextmenu' || this.type == 'DOMMouseScroll' || this.type.indexOf('mouse') == 0 ){
			var doc = window.document.compatElement;
			
			page = {
				x: this.pageX != null ? this.pageX : this.clientX + doc.scrollLeft,
				y: this.pageY != null ? this.pageY : this.clientY + doc.scrollTop
			};
		}
		
		return page;		
	}
});

Object.defineProperty(Event.prototype, 'client', {
	get: function(){
		var client = {};
		
		if( this.touches && this.touches[0] && (this.type.indexOf('touch') == 0 || this.type.indexOf('gesture') == 0) ){
			page = {
				x: this.touches[0].clientX,
				y: this.touches[0].clientY
			}
		}
		else if( this.type == 'click' || this.type == 'dblclick' || this.type == 'contextmenu' || this.type == 'DOMMouseScroll' || this.type.indexOf('mouse') == 0 ){			
			client = {
				x: this.pageX != null ? this.pageX - window.pageXOffset : this.clientX,
				y: this.pageY != null ? this.pageY - window.pageYOffset : this.clientY
			};
		}
		
		return client;		
	}
});

Event.keys = {};
Object.defineProperty(Event.prototype, 'key', {
	get: function(){
		var code = this.wich || this.keyCode, key = Event.keys[code];
		
		if( this.type == 'keydown' || this.type == 'keyup' ){
			if( code > 111 && code < 124 ) key = 'f' + (code - 111);
			else if( code > 95 && code < 106 ) key = code - 96;
		}
		
		if( key == null ) key = String.fromCharCode(code).toLowerCase();
		
		return key;
	}
});

Event.prototype.stop = function(){
	return this.preventDefault().stopPropagation();
};

Event.keys = {
	'8': 'backspace',
	'9': 'tab',
	'13': 'enter',
	'16': 'shift',
	'17': 'ctrl',
	'18': 'alt',
	'20': 'capslock',
	'27': 'esc',
	'32': 'space',
	'33': 'pageup',
	'34': 'pagedown',
	'35': 'end',
	'36': 'home',
	'37': 'left',
	'38': 'up',
	'39': 'right',
	'40': 'down',
	'45': 'insert',
	'46': 'delete',	
	'107': '+',
	'144': 'numlock',
	'145': 'scrolllock',
	'186': ';',
	'187': '=',
	'190': '.',
	'222': "'"
};