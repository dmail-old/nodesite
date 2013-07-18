NS.Editable = {
	element: null,
	value: null,
	startValue: null,
	events: ['focus', 'keydown', 'blur'],

	create: function(element){
		this.element = element;
		this.listen.apply(this, this.events);
		this.element.setAttribute('contenteditable', true);

		// draggable incompatible width contenteditable
		while(element = element.parentNode){
			if( element.hasAttribute('draggable') ){
				this.draggableParent = element;
				element.removeAttribute('draggable');
				break;
			}
		}

		this.element.focus();
	},

	destroy: function(){
		this.element.removeAttribute('contenteditable');
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
		var selection = window.getSelection(), range = document.createRange();

		selection.removeAllRanges();

		range.setStart(this.element.firstChild, start || 0);
		range.setEnd(this.element.lastChild, end || this.element.lastChild.length);

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
		if( this.hasChanged() ){
			console.log('value changed');
		}
		this.startValue = null;
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
