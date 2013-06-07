/* global View, Emitter */

View.extend('node', {
	Implements: [View.Node, View.State],
	tagName: 'li',
	className: 'node',
	modelEvents: {
		'change:name': function(name){
			this.updateName(name);
		}
	},

	constructor: function(model){
		// this.treeEmitter = new TreeEmitter(this);
		// this.on('*', function(name, args){
		// 	args = [this].concat(args);
		// 	this.treeEmitter.applyListeners(name, args);
		// });

		this.initChildren();
		View.prototype.constructor.apply(this, arguments);
	},

	// NOTE: will be override by FileNodeView -> should not be considered empty until loaded
	isEmpty: function(){
		return this.children.length === 0;
	},

	getClassName: function(){
		var className = View.prototype.getClassName.call(this);

		if( this.isEmpty() ){
			className.add('empty');
			className.add('expanded');
		}

		//if( this.has('class') ) className+= ' ' + this.get('class');

		return className;
	},

	scrollTo: function(dom){
		var element = this.getDom(typeof dom == 'string' ? dom : 'li');
		if( element ) element.keepIntoView();

		return this;
	},

	getHTML: function(){
		return '<div><ins class="tool"></ins><span class="name">' + this.model.name + '</span></div>';
	},

	getDom: function(what){
		switch(what){
		case 'li':
			return this.element;
		case 'ul':
		case 'div':
			return this.getDom('li').getChild(what);
		case 'name':
			return this.getDom('div').getChild('span');
		default:
			return this.getDom('div').getChild(what);
		}
	},

	updateName: function(name){
		this.getDom('name').innerHTML = name;
	}
});
