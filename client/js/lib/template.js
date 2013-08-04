var Parser = {
	directives: {},

	collectDirectives: function(node, path){
		if( typeof path != 'string' ) path = '';

		var found = [], name, directive, terminal = false, nodeType = node.nodeType, i, linker;

		for( name in this.directives ){
			directive = this.directives[name];

			if( directive.nodeType == nodeType ){
				linker = directive.compile(node);
				if( linker !== false ){

					linker.path = path;

					found.push(linker);

					if( directive.terminal ) terminal = true;
				}
			}
		}

		// keep searching directives
		if( terminal === false && (nodeType == 1 || nodeType == 11) ){
			found = found.concat(this.collectChildNodesDirectives(node, path));
		}

		return found;
	},

	collectNodeListDirectives: function(nodeList, path){
		if( typeof path != 'string' ) path = '';
		else if( path !== '' ) path+= '.';

		var found = [], i = 0, j = nodeList.length;

		for(;i<j;i++){
			found = found.concat(this.collectDirectives(nodeList[i], path + i));
		}

		return found;
	},

	collectChildNodesDirectives: function(node, path){
		return this.collectNodeListDirectives(node.childNodes, path);
	},

	parse: function(element, descendantOnly){
		var found;

		if( descendantOnly ){
			found = this.collectChildNodesDirectives(element);
		}
		else{
			found = this.collectDirectives(element);
		}

		return found;
	},

	register: function(name, directive){
		this.directives[name] = Directive.extend(directive);
	}
};

var Directive = {
	nodeType: 1,
	terminal: false,
	compile: Function.FALSE
};

// a linker is just a compiled directive
var Linker = {
	path: null,
	toString: function(){
		return 'Linker';
	},
	link: Function.EMPTY,
	unlink: Function.EMPTY	
};

var PropertyLinker = Linker.extend({
	name: null,
	property: null,

	create: function(name, property){
		this.name = name;
		this.property = property;
	},

	toString: function(){
		return 'PropertyLinker';
	},

	link: function(node, model){
		node.bind(this.name, model, this.property);
	},

	unlink: function(node, model){
		node.unbind(this.name);
	}
});

var TokensLinker = Linker.extend({
	name: null,
	tokens: null,

	create: function(name, tokens){
		this.name = name;
		this.tokens = tokens;	
	},

	toString: function(){
		return 'TokensLinker';
	},

	combine: function(values){
		var tokens = this.tokens, result = tokens[0], i = 1, j = tokens.length, value;

		for(;i<j;i+=2){
			value = values[tokens[i]];
			if( value !== undefined ){
				result+= value;
			}
			result+= tokens[i + 1];
		}

		return result;
	},

	link: function(node, model){
		var computedBinding = ComputedBinding.new(this.combine, this);

		var tokens = this.tokens, i = 1, j = this.tokens.length;
		for(;i<j;i+=2){
			// observe part, but dont call resolve for each part change
			computedBinding.observe(tokens[i], model, tokens[i], true);
		}
		// resolve computedBinding.value
		computedBinding.resolve();

		node.bind(this.name, computedBinding, 'value');
	},

	unlink: function(node, model){
		node.unbind(this.name);
	}
});

var LinkerListLinker = Linker.extend({
	list: null,

	create: function(list){
		this.list = list;
	},

	link: function(node, model){
		var list = this.list, i = 0, j = list.length;
		for(;i<j;i++){
			list[i].link(node, model);
		}
	},

	unlink: function(node){
		var list = this.list, i = 0, j = list.length;
		for(;i<j;i++){
			list[i].unlink(node);
		}
	}
});

var ComputedBinding = {
	observers: null,
	values: null,
	value: undefined,
	size: 0,
	combinator: null,
	bind: null,
	closed: false,
	delayed: true,

	create: function(combinator, bind){
		this.observers = {};
		this.values = {};
		this.combinator = combinator;
		this.bind = bind || this;
	},

	resolve: function() {
		if( this.closed === false ){
			if ( !this.combinator ){
				throw Error('ComputedBinding attempted to resolve without a combinator');
			}
			this.value = this.combinator.call(this.bind, this.values);
			this.delayed = false;
		}
	},

	checkResolve: function(force){
		if( this.delayed === false || force === true ){
			this.resolve();
		}
	},	

	valueChanged: function(change){
		this.values[change.name] = change.value;
		this.checkResolve();
	},

	observe: function(name, model, path, suppressResolve) {
		this.unobserve(name);
		this.size++;
		this.observers[name] = window.PathObserver.new(path, model, this.valueChanged, this);
		this.checkResolve(!suppressResolve);
	},

	unobserve: function(name, suppressResolve) {
		if( this.observers[name] ){
			this.size--;
			this.observers[name].close();
			delete this.observers[name];
			delete this.values[name];
			this.checkResolve(!suppressResolve);
		}      
	},

	close: function(){
		if( this.closed === false ){
			for(var key in this.observers){
				this.unobserve(key, true);
			}
			this.closed = true;
			this.value = undefined;
		}
	}
};

// https://github.com/Polymer/mdv/blob/master/src/template_element.js#L871
function parseMustacheTokens(string) {
	if( !string || !string.length ) return;

	var open = '{', close = '}', tokens, length = string.length, startIndex = 0, lastIndex = 0, endIndex = 0;

	while( lastIndex < length ){
		startIndex = string.indexOf(open, lastIndex);
		endIndex = startIndex < 0 ? -1 : string.indexOf(close, startIndex + close.length);
		if( endIndex < 0 ){
			if ( !tokens ) return;
			tokens.push(string.slice(lastIndex)); // TEXT
			break;
		}

		tokens = tokens || [];
		tokens.push(string.slice(lastIndex, startIndex)); // TEXT
		tokens.push(string.slice(startIndex + open.length, endIndex).trim()); // PATH
		lastIndex = endIndex + close.length;
	}

	if( lastIndex === length ){
		tokens.push(''); // TEXT
	}

	return tokens;
}

function isSingleBinding(tokens){
	return tokens.length == 3 && tokens[0].length === 0 && tokens[2].length === 0;
}

function getTokensLinker(name, tokens){
	if( isSingleBinding(tokens) ){
		return PropertyLinker.new(name, tokens[1]);
	}
	else{
		return TokensLinker.new(name, tokens);
	}
}

function getLinker(name, value){
	var tokens = parseMustacheTokens(value);

	if( tokens ){
		return getTokensLinker(name, tokens);
	}

	return false;
}

Parser.register('textnode', {
	nodeType: 3,
	compile: function(node){
		return getLinker('textContent', node.textContent);
	}
});

Parser.register('attribute', {
	nodeType: 1,
	compile: function(node){
		var attributes = node.attributes, i = 0, j = attributes.length, attr, linker, linkerlist = [];

		for(;i<j;i++){
			attr = attributes[i];
			linker = getLinker(attr.name, attr.value); 
			if( linker ){
				linkerlist.push(linker);
			}			
		}

		if( linkerlist.length === 0 ) return false;
		return LinkerListLinker.new(linkerlist);
	}
});

var Template = {
	element: null,
	content: null,
	linkers: null,

	create: function(element){

		this.element = element;
		element.template = this;

		if( 'content' in element ){
			this.content = element.content;
			this.bootstrap(this.content);
		}
		else{
			// any tag can be used as a template
			this.content = document.createDocumentFragment();
			var i = element.childNodes.length;
			while(i--){
				this.content.appendChild(element.childNodes[0]);
			}
		}
	},

	bootstrap: function(element){
		var templateSelector = 'template, *[template]';
		var templates = element.querySelectorAll(templateSelector);
		var i = 0, j = templates.length;
		for(;i<j;i++){
			Template.new(templates[i]);
		}
	},

	parse: function(){
		if( this.linkers == null ){
			this.linkers = Parser.parse(this.content, true);
		}
		return this.linkers;
	},

	cloneContent: function(){
		return this.content.cloneNode(true);
	},

	createInstance: function(){
		var instance = TemplateInstance.new(this);
		this.instances.push(instance);
		instance.insert();
		return instance;
	},

	setModel: function(model){
		this.model = model;
		this.instances = [];

		if( this.element.hasAttribute('repeat') ){

			var repeat = this.element.getAttribute('repeat');
			var observer = window.PathObserver.new(repeat, model, function(change){
				// on répète le template pour chaque item
				if( Array.isArray(change.value) ){

					change.value.forEach(function(item, index, array){
						var instance = this.createInstance();
						// on écoute toutes les clé de ce tableau
						window.PartObserver.new(index, array, function(change){
							// change.oldValue <-- this is lost
							//
							instance.setModel(change.value);
						});

					}, this);

				}
				else{
					// supression de toutes les instances
					this.instances.forEach(function(instance){
						instance.remove();
					});
					this.instances = null;
				}

			}.bind(this));

		}
		else{
			var instance = this.createInstance();
			instance.setModel(model);
		}
	},

	unsetModel: function(){
		if( this.model ){
			this.instances.forEach(function(instance){
				instance.unsetModel();
				instance.remove();
			}, this);
			this.instances = [];
			this.model = null;
		}
	}
};

var TemplateInstance = {
	template: null,
	fragment: null,
	firstNode: null,
	lastNode: null,
	model: null,

	create: function(template){
		this.template = template;

		this.fragment = template.cloneContent();		
		this.firstNode = this.fragment.firstChild;
		this.lastNode = this.fragment.lastChild;

		var first = this.firstNode, last = this.lastNode, node = this.firstNode;
		while( node ){
			node.templateInstance = this;
			if( node == last ) break;
			node = node.nextSibling;
		}
	},

	getNodeAt: function(path){
		var node = this.firstNode, parts, i, j, part;

		if( path !== '' ){
			parts = path.split('.');
			i = 0;
			j = parts.length;

			for(;i<j;i++){
				// on utilise nextSibling (car au premier tour on connait pas node.parentNode.childNodes)
				part = parts[i++];
				while(part--){
					node = node.nextSibling;
					if( node == null ){
						return null;
					}
				}
				if( i < j ){
					node = node.firstChild;
					if( node == null ) break;
				}				
			}
		}		

		return node;
	},

	findNode: function(path){
		var node = this.getNodeAt(path);
		if( node == null ){
			console.log(this.firstNode, path);

			throw new Error('node not found');
		}
		return node;
	},

	link: function(model){
		var linkers = this.template.parse(), i = linkers.length, linker;

		while(i--){
			linker = linkers[i];
			linker.link(this.findNode(linker.path), model);
		}
	},

	unlink: function(model){
		var linkers = this.template.parse(), i = linkers.length, linker;

		while(i--){
			linker = linkers[i];
			linker.unlink(this.findNode(linker.path), model);
		}
	},

	setModel: function(model){
		this.model = model;
		this.link(model);
	},

	// lorsque je fais unsetModel les listeners sur ce modèle doivents disparaitre
	// tous les noeuds écoutant doivent donc être supprimé
	unsetModel: function(model){
		this.unlink(model);
		this.model = null;
	},

	insert: function(parent, before){
		if( typeof parent == 'undefined' ){
			parent = this.template.element.parentNode;
			before = this.template.element.nextSibling;
			// insert after the last templateInstance of that template
			while( before && before.templateInstance && before.templateInstance != this ){
				before = before.nextSibling;
			}
		}

		if( !before ){
			parent.appendChild(this.fragment);
		}
		else{
			parent.insertBefore(this.fragment, before);
		}
	},

	remove: function(){
		var first = this.firstNode, last = this.lastNode, node = this.firstNode, next;

		// put back the node in the fragment
		// -> if insert is called after remove fragment is still filled with the nodeList
		while( node ){
			next = node.nextSibling;
			this.fragment.appendChild(node);
			if( node == last ) break;
			node = next;
		}
	}
};

/*
help for multiple bindings

// pour supporter multiple bindings plus tard:
// je m'inspirerais aussi  de conpoound binding:
// https://github.com/Polymer/mdv/blob/master/src/template_element.js#L1110

*/

/*

help for repeat

https://github.com/Polymer/mdv/blob/master/src/template_element.js#L1194

templateiterator: il s'abonne aux modif sur IF, REPEAT et BIND

observable array:

https://github.com/mennovanslooten/Observable-Arrays/blob/master/js/underscore.observable.js
https://github.com/angular/angular.js/blob/master/src/ng/directive/ngRepeat.js#L267
https://github.com/angular/angular.js/blob/master/src/ng/rootScope.js#L359
http://stackoverflow.com/questions/14966207/javascript-sync-two-arrays-of-objects-find-delta

on s'attend à recevoir les changements suivants:

'move', oldIndex, newindew, value
'remove', index, value
'add', index, value
'update', index, value

var ArrayChangeEmitter = ObjectChangeEmitter.extend({
	instances: [],
});

var array = [];
PartObserver.new(0, array, function(change){
	console.log('[0] = ', change.value);
});
PartObserver.new(1, array, function(change){
	console.log('[1] = ', change.value);
});
array[0] = 'hey';
array[1] = 'ho';
array.reverse();

*/