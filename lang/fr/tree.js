Object.append(lang, {
	"duplicate_title": function(action, node, child, property, value){
		if( action == 'move' ) return 'Déplacement de ' + node.name + ' vers ' + child.parentNode.name;
		if( action == 'copy' ) return 'Copie de ' + node.name + ' vers ' + child.parentNode.name;
		if( action == 'trash' ) return 'Mise à la corbeille de ' + node.name;
		if( action == 'recycle' ) return 'Restauration de ' + node.name;
		if( action == 'update' ) return property == 'name' ? 'Renommage de ' + node.name + ' en ' + value : 'Modification de ' + node.name;
		return 'Conflit entre deux éléments';
	},
	"duplicate_message": function(action, node, child, property, value){
		if( property == 'name' ) return 'Le nom ' + value + ' est déjà utilisé';
		return 'La valeur ' + value + ' est déjà utilisé pour la propriété ' + property;
	},
	"duplicate_resolve": ", que voulez vous faire?"
});