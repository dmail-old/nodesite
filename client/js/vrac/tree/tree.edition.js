/*
---

name: edit

description: permet d'entrer le nom d'un noeud via un input

...
*/

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
}

Tree.definePlugin('edit', {
	node: {
		createInput: function(){
			var input = new Element('input', {
				type: 'text',
				'class': 'rename',
				value: this.name,
				maxLength: 255
			});
			
			return input;
		},
		
		addInput: function(){
			this.tree.element.removeClass('unselectable');
			// ou remove les events de tree.element.keydown dblclick pour pas activer menu en dblcliquant sur l'input
			this.tree.eventList.remove('keydown', 'dblclick'); 
			
			this.tree.element.blur();
			this.tree.element.removeAttribute('tabIndex');
			
			this.getDom('node').removeAttribute('draggable');
			this.getDom('trunk').addClass('editing');
			// insertBefore pour ne pas avoir a préciser la position left de l'input qui doit être à left 0 de name
			this.getDom('node').insertBefore(this.input, this.getDom('name'));
			
			this.input.adapt();
			this.input.select();
			this.tree.emit('editstart', this, this.input);
		},
		
		removeInput: function(e){
			var input = this.input;
			delete this.input;
			
			input.off();
			this.getDom('node').removeChild(input);
			this.getDom('trunk').removeClass('editing');
			this.getDom('node').draggable = true;
				
			this.getDom('name').set('text', this.name);
				
			this.tree.element.setAttribute('tabIndex', 0);
			this.tree.element.focus();
			// node.tree.keyboard.enable();
			this.tree.element.addClass('unselectable');
			this.tree.eventList.add('keydown', 'dblclick');
			
			this.tree.emit('editend', this, input);
			if( e.key != 'esc' ) this.rename(input.value);
		},
		
		edit: function(){
			this.input = this.createInput();
			this.input.node = this;
			this.input.adapt = function(){
				this.style.width = Math.max(20, this.node.getDom('name').set('text', this.value).offsetWidth + 15) + 'px';
			};
			this.input.remove = this.removeInput.bind(this);
			
			this.input.on({
				keyup: this.input.adapt,
				keydown: function(e){
					switch(e.key){
						case 'enter': case 'esc': case 'tab':
							e.preventDefault();
							this.remove(e);
						break;
						default:
							this.adapt(e);
						break;
					}
				},
				blur: this.input.remove
			});
			
			this.addInput();
		}
	},
	
	events: {
		insert: function(node, child){
			if( child.defaultEdit ) child.edit();
		}
	}
});