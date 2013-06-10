/* global Browser */

Browser.Element = window.Element;

window.Element = function(tag, props){
	return tag in Element.constructors ? Element.constructors[tag](props) : document.newElement(tag, props);
};
Element.prototype = Browser.Element.prototype;

Element.constructors = {};
document.newElement = function(tag, props){
	var element = document.createElement(tag);

	if( props ){
		if( props.checked != null ) props.defaultChecked = props.checked;
		element.set(props);
	}

	return element;
};

Object.append(Element, {
	implement: Object.implement.bind(Element),
	complement: Object.complement.bind(Element)
});

String.prototype.toElement = function(){
	var div = document.createElement('div');
	div.innerHTML = this.trim();
	return div.firstChild;
};

window.$ = document.getElementById.bind(document);

document.html = document.documentElement;

if( !('classList' in Element.prototype) ){
	Object.defineProperty(Element.prototype, 'classList', function(){
		var element = this;
		var list = Item('list.string').new(this.className);
		list.update = function(){ element.className = this.toString(); };

		return list;
	});
}

Element.implement({
	hasClass: function(name){
		return this.classList.contains(name);
	},

	addClass: function(name){
		this.classList.add(name);
		return this;
	},

	removeClass: function(name){
		this.classList.remove(name);
		return this;
	}
});

Element.implement({
	toggleClass: function(name, force){
		if( force === undefined ) force = !this.hasClass(name);
		return force ? this.addClass(name) : this.removeClass(name);
	},

	destroy: function(){
		this.clean().getElements('*').call('clean');
		this.dispose();
		return null;
	},

	getSelected: function(){
		//this.selectedIndex; // Safari 3.2.1
		return Array.prototype.filter.call(this.options, function(option){ return option.selected; });
	}
});

Element.inserters = {
	before: function(context, element){
		var parent = element.parentNode;
		if (parent) parent.insertBefore(context, element);
	},

	after: function(context, element){
		var parent = element.parentNode;
		if (parent) parent.insertBefore(context, element.nextSibling);
	},

	bottom: function(context, element){
		element.appendChild(context);
	},

	top: function(context, element){
		element.insertBefore(context, element.firstChild);
	}
};
Element.inserters.inside = Element.inserters.bottom;

Element.implement({
	adopt: function(){
		var parent = this, fragment, elements = toArray(arguments), length = elements.length;
		if( length > 1 ) parent = fragment = document.createDocumentFragment();

		for(var i = 0; i < length; i++){
			var element = elements[i];
			if (element) parent.appendChild(element);
		}

		if( fragment ) this.appendChild(fragment);

		return this;
	},

	appendText: function(text, where){
		return this.grab(this.getDocument().newTextNode(text), where);
	},

	grab: function(el, where){
		Element.inserters[where || 'bottom'](el, this);
		return this;
	},

	inject: function(el, where){
		Element.inserters[where || 'bottom'](this, el);
		return this;
	},

	replaces: function(el){
		el.parentNode.replaceChild(this, el);
		return this;
	},

	wraps: function(el, where){
		return this.replaces(el).grab(el, where);
	},

	dispose: function(){
		return this.parentNode ? this.parentNode.removeChild(this) : this;
	},

	empty: function(){
		Array.prototype.call.call(this.childNodes, 'dispose');
		return this;
	},

	clean: function(){
		if( this.removeListeners ) this.removeListeners();
		if( this.clearAttributes ) this.clearAttributes();
		return this;
	}
});
