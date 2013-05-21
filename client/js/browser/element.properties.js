(function(){

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
		('className' in this) ? this.className = (value || '') : this.setAttribute('class', value);
	},

	'for': function(value){
		('htmlFor' in this) ? this.htmlFor = value : this.setAttribute('for', value);
	},

	'style': function(value){
		(this.style) ? this.style.cssText = value : this.setAttribute('style', value);
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
		(property && property.set) ? property.set.call(this, value) : this.setProperty(prop, value);
	}.overloadSetter(),

	get: function(prop){
		var property = Element.Properties[prop];
		return (property && property.get) ? property.get.apply(this) : this.getProperty(prop);
	}.overloadGetter(),

	erase: function(prop){
		var property = Element.Properties[prop];
		(property && property.erase) ? property.erase.apply(this) : this.removeProperty(prop);
		return this;
	}
});

// fix IE button submit 
(function(){

var input = document.createElement('input');
input.value = 't';
input.type = 'submit';

if( input.value != 't' ){
	propertySetters.type = function(type){ var value = this.value; this.type = type; this.value = value; };
}

})();

})();

var Storage = new Class({
	initialize: function(){
		this.clear();
	},
	
	clear: function(){
		this.store = {};
		this.length = 0;
		return this;
	},
	
	contains: function(name){
		return name in this.store;
	},
	
	get: function(name){
		return this.store[name];
	},
	
	set: function(name, value){
		this.store[name] = value;
		this.length++;
		return this;
	},
	
	remove: function(name){
		delete this.store[name];
		this.length--;
	}
});

Storage.prototype.has = Storage.prototype.contains;
Storage.prototype.reset = Storage.prototype.clear;

[Element.prototype, window, document].forEach(function(item){
	Object.defineProperty(item, 'storage', {
		get: function(){
			if( !this.store ) this.store = new Storage();
			return this.store;
		},
		enumerable: true,
		configurable: false
	});
});