NS.EditableTextNode = {
	textNode: null,
	input: null,
	inputEmitter: null,
	minwidth: 20,
	addwidth: 15,

	create: function(textNode){
		this.textNode = textNode;
	},

	getNodeValue: function(){
		return this.textNode.nodeValue;
	},

	setNodeValue: function(value){
		this.textNode.nodeValue = value;
	},

	createInput: function(){
		var input = document.createElement('input');

		input.type = 'text';
		input.className = 'editor';

		return input;
	},

	getNodeWidth: function(){
		var range = document.createRange(), rect;
		range.selectNodeContents(this.textNode);
		rect = range.getBoundingClientRect();
		return rect.right - rect.left;
	},

	getInputValue: function(){
		return this.input.value;
	},

	setInputValue: function(value){
		this.input.value = value;
	},

	setInputWidth: function(width){
		if( width < this.minwidth ) width = this.minwidth;
		this.input.style.width = width + 'px';
	},

	adaptInput: function(e){
		this.setNodeValue(this.getInputValue());
		this.setInputWidth(this.getNodeWidth() + this.addwidth);
	},

	end: function(e){
		if( this.input ){
			this.inputEmitter.off();
			this.inputEmitter = null;
			this.textNode.parentNode.removeChild(this.input);
			this.input = null;
		}
	},

	edit: function(e){
		this.input = this.createInput();

		this.inputEmitter = NS.ElementEmitter.new(this.input, this);
		this.inputEmitter.on({
			keyup: this.adaptInput,
			keydown: function(e){
				switch(e.key){
				case 'enter':
				case 'esc':
				case 'tab':
					e.preventDefault();
					this.end(e);
					break;
				default:
					this.adaptInput(e);
					break;
				}
			},
			blur: this.end
		});

		this.textNode.parentNode.insertBefore(this.input, this.textNode);

		this.setInputValue(this.getNodeValue());
		this.adaptInput();
		this.input.select();
	}
};

var Range = {
	select: function(input, start, end){
		if( input.setSelectionRange ){
			input.focus();
			input.setSelectionRange(start, end);
		}
		else if( input.createTextRange ){
			var range = input.createTextRange();
			range.collapse(true);
			range.moveEnd('character', end);
			range.moveStart('character', start);
			range.select();
		}
		else input.select(); // sélectionne tout tant pis
	}
};
