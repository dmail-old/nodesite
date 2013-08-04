var NodeBinding = {
	closed: false,
	node: null,
	property: null,
	observer: null,

	create: function(node, property, model, path){
		this.node = node;
		this.property = property;
		this.observer = window.PathObserver.new(path, model, this.onchange, this);
	},

	onchange: function(change){
		this.valueChanged(change.value);
	},

	valueChanged: function(value){
		this.node[this.property] = this.encodeValue(value);
	},

	encodeValue: function(value){
		return value === undefined ? '' : String(value);
	},

	close: function(){
		if( this.closed === false ){
			this.observer.close();
			this.observer = null;
			this.node = null;
			this.closed = true;
		}
	}
};

Node.prototype.bind = function(name, model, path){
	console.error('Unhandled binding to Node: ', this, name, model, path);
};

Node.prototype.unbind = function(name) {
	this.bindings = this.bindings || {};
	var binding = this.bindings[name];
	if( binding && typeof binding.close === 'function' ) binding.close();
	delete this.bindings[name];
};

Node.prototype.unbindAll = function(){
	if( !this.bindings ) return;
	
	var names = Object.keys(this.bindings), i = 0, j = names.length, binding;
	for(;i<j;i++) {
		binding = this.bindings[names[i]];
		if( binding ) binding.close();
	}

	this.bindings = {};
};

Text.prototype.bind = function(name, model, path){
	if( name !== 'textContent' ){
		return Node.prototype.bind.call(this, name, model, path);
	}
	this.unbind(name);
	return this.bindings[name] = NodeBinding.new(this, 'textContent', model, path);
};

var AttributeBinding = NodeBinding.extend({
	conditionalEnd: '?',
	conditional: false,

	create: function(element, attrName, model, path){
		this.conditional = attrName.endsWith(this.conditionalEnd);

		if( this.conditional ) {
			element.removeAttribute(attrName);
			attrName = attrName.slice(0, - this.conditionalEnd.length);
		}
		
		NodeBinding.create.call(this, element, attrName, model, path);
	},

	valueChanged: function(value) {
		if( this.conditional ){
			if( value ){
				this.node.setAttribute(this.property, '');
			}
			else{
				this.node.removeAttribute(this.property);
			}
		}
		else{
			this.node.setAttribute(this.property, this.encodeValue(value));
		}	
    }
});

Element.prototype.bind = function(name, model, path) {
	this.unbind(name);
	return this.bindings[name] = AttributeBinding.new(this, name, model, path);
};