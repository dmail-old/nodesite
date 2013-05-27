/* global
	View, NodeView,
	ViewController,
	ViewControllerSelection,
	ViewControllerMultipleSelection,
	ViewControllerLighted,
	ViewControllerCSS
*/

/*

NOTE

le scroll auto lors de expand/contract cherche à garder visibles les 'ul'
mais les 'um' font 100% de largeur au lieu de la largeur de leur contenu

idée1:
- si on met l'arbre en mode compact le 'ul' pourras si en plus on met les 'li' en float left
faire la largeur de son contenu

- on perds alors la possibilité de drop un fichier hors d'un li

*/

var TreeView = new Class({
	Extends: View,
	tagName: 'div',
	multiSelection: true,
	events: {
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

		click: function(e){
			var view = this.getViewFromEvent(e);

			if( view ){
				if( this.multiSelection ) this.selection.unselectOther(view, e);
			}
			else this.selection.unselect(e);
		},

		dblclick: function(e){
			var view = this.getViewFromEvent(e);

			if( view ){
				if( e.target.tagName.toLowerCase() != 'tool' ){
					if( this.menu ) this.menu.activeFirst(e);
					else view.toggleState('expanded', e);
				}
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
	},

	attributes: {
		'tabindex': 0,
		'class': 'tree line hideRoot'
	},

	initialize: function(root){
		View.prototype.initialize.call(this, root);

		this.root = new NodeView(root);

		this.lighted = new ViewControllerLighted(this);
		this.selection = new ViewControllerMultipleSelection(this);
		this.cssController = new ViewControllerCSS(this);
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
