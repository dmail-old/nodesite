/*
Un des défaut majeur de cette solution:
maxlength non supporté, à simuler

en écoutant keydown, ou keypress + e.preventDefault
*/

NS.Editable = {
	element: null,
	value: null,
	startValue: null,
	onchange: null,
	bind: null,
	draggableParent: null,
	events: ['focus', 'keydown', 'blur'],

	create: function(element, onchange, bind){
		if( element.hasAttribute('contenteditable') ) return;

		this.element = element;
		this.onchange = onchange;
		this.bind = bind || this;

		// need to be selectable (user-select:text)
		this.element.addClass('selectable');
		// draggable incompatible width contenteditable
		while(element && element.nodeType == 1){
			if( element.hasAttribute('draggable') ){
				this.draggableParent = element;
				element.removeAttribute('draggable');
				break;
			}
			element = element.parentNode;
		}

		this.element.setAttribute('contenteditable', true);
		this.listen.apply(this, this.events);

		this.element.focus();
	},

	destroy: function(){
		this.element.removeAttribute('contenteditable');
		this.element.removeClass('selectable');
		if( this.draggableParent ) this.draggableParent.setAttribute('draggable', true);
		this.stopListening.apply(this, this.events);
	},

	listen: function(){
		for( var i in arguments ) this.element.addEventListener(arguments[i], this);
	},

	stopListening: function(){
		for( var i in arguments ) this.element.removeEventListener(arguments[i], this);
	},

	handleEvent: function(e){
		this[e.type](e);
	},

	getValue: function(){
		return this.element.innerHTML;
	},

	getOption: function(name){
		if( this.element.hasAttribute('data-' + name) ){
			return this.element.getAttribute('data-' + name);
		}

		return null;
	},

	selectContent: function(start, end){
		var range = document.createRange(), selection = window.getSelection();

		range.setStart(this.element.firstChild, start || 0);
		range.setEnd(this.element.lastChild, end || this.element.lastChild.length);

		selection.removeAllRanges();
		selection.addRange(range);
	},

	hasChanged: function(){
		this.value = this.getValue();
		return this.value != this.startValue;
	},

	focus: function(e){
		this.startValue = this.getValue();
		if( this.getOption('selectonfocus') ){
			this.selectContent();
			//this.selectContent(0, this.startValue.lastIndexOf('.'));
		}
	},

	blur: function(e){
		if( this.hasChanged() && typeof this.onchange == 'function' ){
			this.onchange.call(this.bind, this.value, this.startValue);
		}
		this.destroy();
	},

	keydown: function(e){
		if( e.key == 'esc' ){
			if( this.hasChanged() ){
				document.execCommand('undo', false, null);
			}
			this.element.blur();
		}
		else if( e.key == 'enter' ){
			e.preventDefault();
			this.element.blur();
		}
		else if( e.key == 'tab' ){
			e.preventDefault();
			this.element.blur();
		}
		else{
			//console.log('change');
		}
	}
};
