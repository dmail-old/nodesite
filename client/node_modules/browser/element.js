var exports = function Element(tag, props){
	return tag in Element.constructors ? Element.constructors[tag](props) : document.newElement(tag, props);
};

exports.prototype = window.Element.prototype;

document.newElement = function(tag, props){
	var element = document.createElement(tag);

	if( props ){
		if( props.checked != null ) props.defaultChecked = props.checked;
		element.set(props);
	}

	return element;
};

exports.constructors = {};

exports.implement = Object.implement.bind(exports);
exports.complement = Object.complement.bind(exports);

String.implement('toElement', function(){
	var div = document.createElement('div');
	div.innerHTML = this.trim();
	return div.firstChild;
});

window.$ = document.getElementById.bind(document);

document.html = document.documentElement;

if( !('classList' in exports.prototype) ){
	Object.defineProperty(exports.prototype, 'classList', function(){
		var element = this;
		var list = NS.ListString.new(this.className);
		list.update = function(){ element.className = this.toString(); };

		return list;
	});
}

exports.implement({
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
	},

	toggleClass: function(name, force){
		if( force === undefined ) force = !this.hasClass(name);
		return force ? this.addClass(name) : this.removeClass(name);
	}
});

exports.implement({
	adopt: function(){
		var parent = this, fragment, i = 0, j = arguments.length, element;

		if( j > 1 ){
			parent = fragment = document.createDocumentFragment();
		}
		for(;i<j;i++){
			element = arguments[i];
			if( element ) parent.appendChild(element);
		}
		if( fragment ){
			this.appendChild(fragment);
		}

		return this;
	},

	appendText: function(text){
		return this.appendChild(this.getDocument().newTextNode(text));
	},

	replaces: function(el){
		el.parentNode.replaceChild(this, el);
		return this;
	},

	wraps: function(el){
		return this.replaces(el).appendChild(el);
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
	},

	destroy: function(){
		this.clean().getElements('*').call('clean');
		this.dispose();
		return null;
	}
});

NS.browser.Element = window.Element;
window.Element = exports;
