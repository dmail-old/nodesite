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

Controller.define('focused', {
	Implements: Controller.Node,
	events: {
		'view:focus': function(view, e){
			var current = this.focused;
			this.focused = view;
			if( current && current != view ) current.blur(e);
		},

		'view:blur': function(view, e){
			if( !this.focused ){
				// blur d'un noeud sans qu'aucun autre ne prenne se place
				this.focused = view.getSibling() || view.parentNode;
			}
		},

		'view:expand': function(view, e){
			//if( this.view.element.hasFocus() ) view.scrollTo('ul');
		},

		'view:contract': function(view, e){
			//if( this.view.element.hasFocus() ) view.scrollTo('ul');
		},

		'mousedown': function(view, e){
			if( view && view != this.view ){
				view.focus(e);
			}
		}
	},
	focused: null
});

Controller.prototype.getFocused = function(){
	var controller = this.getController('focused');
	return controller ? controller.focused : null;
};
