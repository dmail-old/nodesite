/*

-- add lighted class if ---

a view emit 'light'
a view emit 'mouseover'

and store the view in this.lighted

-- remove lighted class if ---

a view emit 'mouseout' and no controlled view is the relatedTarget
an other view get lighted class
a view emit 'unlight'


alors voilà ce que j'avais dit:

ceci devient indépendant des vues, en gros ceci peut se mettre sur nimporte quel élément HTML
pour les vues je le met sur l'élément HTML de la vue

ce que fait cette classe c'est de lighted les sous éléments et l'élément concerné
typiquement il écoute des events 'mouseover', 'mouseout' et les éléments pour lequels
acceptNode retourne true récup la classe lighted
on modifieras la fonction qui met lighted pour que la vue mette lighted et non l'élément

ce principe seras réutilisé pour sélection,nav etc

*/

NS.Controller.define('lighted', {
	lighted: null,
	state: 'lighted',
	viewListeners: {
		'light': function(e){
			this.setLighted(e.target, e.args[0]);
		},

		'unlight': function(e){
			this.unsetLighted(e.target, e.args[0]);
		},

		'unlightAll': function(e){
			this.unsetLighted(this.lighted, e.args[0]);
		},

		'destroy': function(e){
			if( e.target == this.lighted ) this.lighted = null;
		}
	},

	setLighted: function(view, e){
		if( view && !view.hasClass(this.state) ){
			this.unsetLighted(this.lighted, e);
			this.lighted = view;
			view.addClass(this.state);
		}
	},

	unsetLighted: function(view, e){
		if( view && view.hasClass(this.state) ){
			view.removeClass(this.state);
			this.lighted = null;
		}
	}
});
