Element.Properties = {};

Element.Properties.tagName = Element.Properties.name = {
	get: function(){
		return this.tagName.toLowerCase();
	}
};

var propertyGetters = {}, propertySetters = {}, properties = {};

['type', 'value', 'defaultValue', 'accessKey', 'cellPadding', 'cellSpacing', 'colSpan', 'frameBorder', 'rowSpan', 'tabIndex', 'useMap'].forEach(function(property){
	properties[property.toLowerCase()] = property;
});
properties.html = 'innerHTML';
properties.text = document.createElement('div').textContent == null ? 'innerText': 'textContent';
Object.forEach(properties, function(real, key){
	propertySetters[key] = function(value){ this[real] = value; };
	propertyGetters[key] = function(){ return this[real]; };
});

// Booleans
[
	'compact', 'nowrap', 'ismap', 'declare', 'noshade', 'checked',
	'disabled', 'readOnly', 'multiple', 'selected', 'noresize',
	'defer', 'defaultChecked', 'autofocus', 'controls', 'autoplay',
	'loop'
].forEach(function(bool){
	var lower = bool.toLowerCase();
	propertySetters[lower] = function(value){ this[bool] = Boolean(value); };
	propertyGetters[lower] = function(){ return Boolean(this[bool]); };
});

Object.append(propertyGetters, {
	'class': function(){
		return 'className' in this ? this.className || null : this.getAttribute('class');
	},

	'for': function(){
		return 'htmlFor' in this ? this.htmlFor : this.getAttribute('for');
	},

	'href': function(){
		return 'href' in this ? this.getAttribute('href', 2) : this.getAttribute('href');
	},

	'style': function(){
		return this.style ? this.style.cssText : this.getAttribute('style');
	},

	'tabindex': function(){
		var attributeNode = this.getAttributeNode('tabindex');
		return attributeNode && attributeNode.specified ? attributeNode.nodeValue : null;
	},

	'type': function(){
		return this.getAttribute('type');
	},

	'maxlength': function(){
		var attributeNode = this.getAttributeNode('maxLength');
		return attributeNode && attributeNode.specified ? attributeNode.nodeValue : null;
	}
});

Object.append(propertySetters, {
	'class': function(value){
		if( 'className' in this ) this.className = value || '';
		else this.setAttribute('class', value);
	},

	'for': function(value){
		if( 'htmlFor' in this ) this.htmlFor = value;
		else this.setAttribute('for', value);
	},

	'style': function(value){
		if( this.style ) this.style.cssText = value;
		else this.setAttribute('style', value);
	},

	'value': function(value){
		this.value = (value != null) ? value : '';
	}
});

Element.implement({
	hasProperty: function(name){
		return this.hasAttribute(name);
	},

	setProperty: function(name, value){
		var setter = propertySetters[name.toLowerCase()];
		if( setter ) setter.call(this, value);
		else{
			if( value == null ) this.removeAttribute(name);
			else this.setAttribute(name, String(value));
		}
		return this;
	},

	setProperties: function(attributes){
		Object.eachPair(attributes, this.setProperty, this);
		return this;
	},

	getProperty: function(name){
		var getter = propertyGetters[name.toLowerCase()];
		if( getter ) return getter.call(this);
		return this.getAttribute(name);
	},

	getProperties: function(){
		return toArray(arguments).map(this.getProperty, this).associate(arguments);
	},

	removeProperty: function(name){
		return this.setProperty(name, null);
	},

	removeProperties: function(){
		Array.prototype.forEach.call(arguments, this.removeProperty, this);
		return this;
	},

	set: function(prop, value){
		var property = Element.Properties[prop];
		if( property && property.set ) property.set.call(this, value);
		else this.setProperty(prop, value);
	}.overloadSetter(),

	get: function(prop){
		var property = Element.Properties[prop];
		if( property && property.get ) return property.get.apply(this);
		else return this.getProperty(prop);
	}.overloadGetter(),

	erase: function(prop){
		var property = Element.Properties[prop];
		if( property && property.erase ) property.erase.apply(this);
		else this.removeProperty(prop);
		return this;
	}
});

/*[Element.prototype, window, document].forEach(function(item){
	Object.defineProperty(item, 'storage', {
		get: function(){
			if( !this.store ) this.store = {};
			return this.store;
		},
		enumerable: true,
		configurable: false
	});
});*/
