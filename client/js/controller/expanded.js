/*

NOTE

le scroll auto lors de expand/contract cherche à garder visibles les 'ul'
mais les 'ul' font 100% de largeur au lieu de la largeur de leur contenu

idée1:
- si on met l'arbre en mode compact le 'ul' pourras si en plus on met les 'li' en float left
faire la largeur de son contenu

- on perds alors la possibilité de drop un fichier hors d'un li

*/

NS.Controller.define('expanded', {
	state: 'expanded',
	viewListeners: {
		'mousedown': function(e){
			if( e.args[0].target.hasClass('tool') ){
				e.target.toggleState(this.state);
			}
		},

		// le futur menu contextuel doit prendre le pas sur ce dblclick
		'dblclick': function(e){
			if( !e.args[0].target.hasClass('tool') ){
				event.target.toggleState(this.state);
			}
		},

		'expand': function(e){
			var view = e.target;

			view.addClass(this.state);
			if( !view.getChildrenElement() ) view.renderChildren();
		},

		'contract': function(e){
			var view = e.target;

			view.removeClass(this.state);
		}
	}
});

