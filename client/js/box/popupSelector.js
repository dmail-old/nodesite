/* global SelectorElement, Popup */

/*

cette balise ouvre une popup qui permet de choisir parmi une liste

TODO
- on doit pouvoir dropper des fichiers directement sur la balise ce qui reviendrais à dropper un fichier dans le dossier
- la balise peut très bien être liée à une liste d'input radio ou autre
-> dans ce cas c'est le rendu visuel de l'élément HTML correspondant au noeud qui est modifié (input radio)
mais pas le fait que ce soit le noeud d'un arbre
-> cela suppose alors qu'un élément puisse être rendu sous forme d'input radio, de balise Select, ou d'option de select

FIX

*/

var PopupSelectorElement = new Class(SelectorElement, {
	html: '\
		<div class="selector">\
			<div class="input" tabindex="0"></div>\
			<div class="tool">...</div>\
		</div>\
	',
	width: 200,

	initialize: function(options){
		this.popup = new Popup();
		this.popup.on('close', function(e){ this.close(e); this.input.focus(e); }.bind(this));

		SelectorElement.prototype.initialize.call(this, options);

		this.setListElement(this.popup.element);
	},

	destroy: function(){
		SelectorElement.prototype.destroy.call(this);
		this.popup.destroy();
	},

	appendListElement: function(){
		document.body.appendChild(this.popup.element);
	},

	adaptListElement: function(){
		this.popup.updateContent();
	},

	showListElement: function(e){
		this.popup.open(e);
	},

	hideListElement: function(e){
		this.popup.close(e);
	}
});
