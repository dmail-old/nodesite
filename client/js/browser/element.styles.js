/* global Browser */

Element.Styles = {};

Element.Styles.opacity = {	
	get: function(){
		return this.style.opacity === '' ? 1 : this.style.opacity.toFloat();
	},
	
	set: function(value){
		this.style.opacity = value != null ? parseFloat(value) : value;
	}
};

Element.Styles.width = {
	set: function(value){
		this.style.width = typeof value == 'number' ? value + 'px' : value;
	}
};

Element.Styles.height = {
	set: function(value){
		this.style.height = typeof value == 'number' ? value + 'px' : value;
	}
};

Element.Styles.zIndex = {
	get: Element.prototype.getComputedStyle,
	set: function(value){ this.style.zIndex = value; }
};

Element.Properties.style = {
	set: function(style){
		this.style.cssText = style;
	},

	get: function(){
		return this.style.cssText;
	},

	erase: function(){
		this.style.cssText = '';
	}
};

Element.Properties.tag = {
	get: function(){
		return this.tagName.toLowerCase();
	}
};

Element.Properties.html = {
	set: function(html){
		if (html == null) html = '';
		else if (html instanceof Array) html = html.join('');
		this.innerHTML = html;
	},

	erase: function(){
		this.innerHTML = '';
	}
};

String.implement({
	camelCase: function(){
		return String(this).replace(/-\D/g, function(match){
			return match.charAt(1).toUpperCase();
		});
	},

	hyphenate: function(){
		return String(this).replace(/[A-Z]/g, function(match){
			return ('-' + match.charAt(0).toLowerCase());
		});
	}
});

var floatName = document.html.style.cssFloat == null ? 'styleFloat' : 'cssFloat';

Element.implement({	
	getComputedStyle: function(name){
		if( this.currentStyle ) return this.currentStyle[name.camelCase()];
		var defaultView = this.getDocument().defaultView, computed = defaultView ? defaultView.getComputedStyle(this, null) : null;
		return computed ? computed.getPropertyValue(name == floatName ? 'float' : name.hyphenate()) : null;
	},
	
	setStyle: function(name, value){
		if( typeof name != 'string' ) throw new TypeError('string expected');
		
		var style = Element.Styles[name];
				
		if( style && style.set ){
			style.set.call(this, value);
		}
		else{
			if( typeof value == 'number' ) value+= 'px';
			else if( value == String(Number(value)) ) value = Math.round(value);
			
			name = name == 'float' ? floatName : name.camelCase();
			this.style[name] = value;
		}
		return this;
	},

	getStyle: function(name){
		var style = Element.Styles[name], result;
		
		if( style && style.get ){
			result = style.get.call(this);
		}
		else{
			name = name == 'float' ? floatName : name.camelCase();
			result = this.style[name];
			if( !result ) result = this.getComputedStyle(name);
		}
		
		return result;
	},

	setStyles: function(styles){
		Object.eachPair(styles, this.setStyle, this);
		return this;
	},

	getStyles: function(){
		var result = {};
		Array.prototype.forEach.call(arguments, function(name){ result[name] = this.getStyle(name); }, this);
		return result;
	},
	
	blink: function(fn, bind){
		// can't use setProperty hidden because an element having display: block tke priority over hidden and the element stays visible
		
		var display = this.style.display;
		
		this.style.display = 'none';
		fn.call(bind || this);
		this.style.display = display;
		
		return this;
	}
});

// chrome et safari bug 13343
if( browser.safari || browser.chrome ){
	['top', 'left', 'bottom', 'right'].each(function(direction){
		Element.Styles['margin-'+direction] = {
			get: function(){
				var margin;
				
				this.blink(function(){
					margin = this.getComputedStyle('margin-' + direction);
				});
				
				return margin;
			}
		};
	});
}

