var lang = {
	"key_space": "espace",
	"key_enter": "entrée",
	"key_delete": "suppr",
	"key_insert": "ins"
};

lang.menu = {
	"active": 'Ouvrir',	
	"trash": "mettre à la corbeille",
	
	"insert": "nouveau",
	"insert_dir": "dossier",
	"insert_file": "fichier",
	"getInsertName": function(type){
		if( type == 'map' ) return 'Nouvelle carte.map';
		return "Nouveau " + lang.menu['insert_' + type];
	},
	"properties": "Propriétés",
	"display": "Affichage",
	"soft": "Large",
	"dot": "Compact",
	"sort": "Trier par",
	"asc": "Ordre croissant",
	"desc": "Ordre décroissant",
	
	"valid_trash": "Mettre à la corbeille l'élément \"{name}\" ?",
	"valid_remove": "Supprimer l'élément \"{name}\" ?",
	"valid_multi_trash": "Mettre à la corbeille ces {count} éléments",
	"valid_multi_remove": "Supprimer ces {count} éléments",
};

Object.eachPair({
	move: 'le déplacement',
	copy: 'la copie',
	rename: 'le renommage',
	insert: 'l\'insertion',
	remove: 'la suppression',
	recycle: 'la mise à la corbeille',
}, function(key, value){
	lang.menu['undo_' + key] = lang.menu.undo + ' ' + value;
	lang.menu['redo_' + key] = lang.menu.redo + ' ' + value;
});

lang.menu['undo_recycle'] = 'Récupérer depuis la corbeille';
lang.menu['redo_trash'] = 'Remettre à la corbeille';

module.exports = lang;