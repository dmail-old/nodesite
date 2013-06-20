/*

NOTE

le scroll auto lors de expand/contract cherche à garder visibles les 'ul'
mais les 'ul' font 100% de largeur au lieu de la largeur de leur contenu

idée1:
- si on met l'arbre en mode compact le 'ul' pourras si en plus on met les 'li' en float left
faire la largeur de son contenu

- on perds alors la possibilité de drop un fichier hors d'un li

*/

NS.ExpandController = NS.Controller.extend({
	name: 'expand',
	viewListeners: {
		'expand': function(e){
			var view = e.target;

			view.addClass('expanded');
			if( !view.getChildrenElement() ) view.renderChildren();
		},

		'contract': function(e){
			e.target.removeClass('expanded');
		}
	}
});

