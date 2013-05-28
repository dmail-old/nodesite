/* global View, NodeView */

/*
	mousedown: function(e){
		var view = this.getViewFromEvent(e);

		if( view ){
			if( e.target.tagName.toLowerCase() == 'tool' ){ view.focus(e); view.toggleState('expanded', e); }
			if( this.multiSelection && e.control ){ view.focus(e); view.toggleState('selected', e); }
			else{
				this.nav.go(view, e);
			}
		}
		else{
			this.selection.unselect(e);
		}
	},

	keydown: function(e){
		if( e.control && e.key == 'a' ){
			if( this.multiSelection ) this.nav.visibles.forEach(function(el){ View(el).select(e); });
		}
		else{
			this.nav.keydown(e);
		}
	}
*/

var TreeView = new Class({
	Extends: View,
	tagName: 'div',
	attributes: {
		'tabindex': 0,
		'class': 'tree line hideRoot'
	},

	initialize: function(){
		View.prototype.initialize.call(this);
		this.root = new NodeView(root);
	},

	insertElement: function(){
		View.prototype.insertElement.apply(this, arguments);

		var ul = this.element.appendChild(new Element('ul'));

		this.root.render();

		if( this.element.hasClass('hideRoot') ){
			this.root.insertChildren(ul);
		}
		else{
			this.root.insertElement(ul);
		}

		return this;
	},

	getLine: function(element){
		if( !element ) return 0;

		// tention pour control ce seras 'size', 'x'
		// on fait -1 parce que dans le CSS on a mit un margin-top:-1px pour éviter le chevauchement des bords des noeuds
		return element.getChild('div').measure('size', 'y') - 1;
	}
});
