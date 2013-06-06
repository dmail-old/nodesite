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

Controller.extends('focused', {
	Implements: Controller.Node,
	events: {
		'view:focus': function(view, e){
			var previous = this.focused;

			this.setFocused(view);
			if( previous ) previous.blur(e);
		},

		'view:blur': function(view, e){
			if( view == this.focused ) this.unsetFocused();
		},

		'view:leave': function(view){
			if( view == this.focused ) this.unsetFocused();
		},

		'mousedown': function(view, e){
			if( view && view != this.view ){
				view.focus(e);
			}
		}
	},
	focused: null,

	setFocused: function(view){
		this.focused = view;
	},

	unsetFocused: function(view){
		this.focused = null;
	}
});

Controller.prototype.getFocused = function(){
	var controller = this.getController('focused');
	return controller ? controller.focused : null;
};
