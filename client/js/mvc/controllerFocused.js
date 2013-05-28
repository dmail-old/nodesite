/* global Controller */

/*

NOTE

le scroll auto lors de expand/contract cherche à garder visibles les 'ul'
mais les 'ul' font 100% de largeur au lieu de la largeur de leur contenu

idée1:
- si on met l'arbre en mode compact le 'ul' pourras si en plus on met les 'li' en float left
faire la largeur de son contenu

- on perds alors la possibilité de drop un fichier hors d'un li

*/

var ControllerFocused = new Class({
	Extends: Controller,
	events: {
		'view:focus': function(view, e){
			var current = this.view.focused;
			this.view.focused = view;
			if( current && current != view ) current.blur(e);
		},

		'view:blur': function(view, e){
			if( !this.view.focused ){
				// blur d'un noeud sans qu'aucun autre ne prenne se place
				this.view.focused = view.getSibling() || view.parentNode || this.view.root;
			}
		},

		'view:expand': function(view, e){
			//if( this.view.element.hasFocus() ) view.scrollTo('ul');
		},

		'view:contract': function(view, e){
			//if( this.view.element.hasFocus() ) view.scrollTo('ul');
		},

		'mousedown': function(view, e){
			if( view ){
				view.focus(e);
			}
		}
	}
});

Controller.register('focused', ControllerFocused);
