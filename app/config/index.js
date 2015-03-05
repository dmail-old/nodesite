var config = {
	"protocol": "http",
	// encodage des pages
	"host": "127.0.0.1",
	"port": 8000,
	"charset": "utf8",
	"lang": "fr",
	"local": true,
	// lorsque une erreur se produit elle est affichée même si l'utilisateur n'est pas connu
	"debug": true
};

// fichier js qu'on envoie au client
config.js = [];

// fichier css qu'on envoie au client
config.css = [
	"site",
	/*
	"resize",
	"box",
	"popup",
	"selectionRectangle",
	"node",
	"root",
	"menu",
	"tree",
	"selector",
	"editor"
	*/
];

/*

ces fonctions sont appelées lorsqu'une requête demande à éxécuté un script situé dans le dossier "action"

return true -> authorise à éxécuter l'action
return false -> empêche d'éxécuter l'action
return error -> empêche de faire l'action et donne des précisions sur pourquoi

*/

/*
config.socket = {
	// TODO origines autorisées pour les sockets
	"origins": "*:*"
};
*/

/*
config.db = {
	"host": "127.0.0.1",
	"port": 8125,
	// "name": "ovalia",
	"user": "root",
	"password": ""
};
*/

// mimetype par défaut
config.mimetype = "application/octet-stream";

config.mimetypes = {
	// text
	"txt": "text/plain",
	"html": "text/html",
	"css": "text/css",
	"appcache": "text/cache-manifest",
	// application
	"js": "application/javascript",
	"json": "application/json",
	"xml": "application/xml",
	"gz": "application/x-gzip",
	"zip": "application/zip",
	"pdf": "application/pdf",
	// image
	"png": "image/png",
	"gif": "image/gif",
	"jpg": "image/jpeg",
	// audio
	"mp3": "audio/mpeg"
};

config.getMimetype = function(fileName){
	var path = require('path');
	return config.mimetypes[path.extname(fileName).substr(1)] || config.mimetype;
};

/* Configurations des pages
id: id de la page qui seras stocké dans la bdd
public: si true cete page n'est pas protégée par login
robot: utilisé pour google
	noindex -> ne référence pas la page
	nofollow -> ne suit pas les liens
	noarchive -> ne met pas la page en cache
ptet ajouté noanalytics: si je veux pas qu'une page soit prise en compte par google analytics
*/
config.pages = {
	"/": {
		// root pages execution always authorized
		"access": function(){ return true; }
	},

	"index": {
		"id": 0,
		"public": true
	},

	// les actions de la BDD
	"database": {
		"access": function(tableName, selector){
			var action = this.name;
			var args = this.args;
			var isAnonymous = false, isUser = false, isAdmin = false, user = this.user;

			if( user ){
				isAnonymous = true;
				if( user.level === 1 ){
					isAdmin = true;
				}
			}
			else{
				isAnonymous = true;
			}

			// l'admin fait ce qu'il veut
			if( isAdmin ){
				return true;
			}

			// un utilisateur?
			if( isUser ){
				// peut chercher dans toutes les tables
				if( action == 'find' ){
					return true;
				}

				// ne peut rien insérer pour le moment
				if( action == 'insert' ){
					return false;
				}

				// ne peut supprimer que des données lui appartenant
				if( action == 'remove' || action == 'update'  ){
					var Selector = require('./client/js/util/selector/selector.js');

					selector = args[1] = Selector.new(selector);

					var owner;

					if( tableName === 'user' ){
						owner = function(item){
							return item.id === user.id;
						};
					}
					else{
						owner = function(item){
							return item.user === user.id;
						};
					}

					selector.match = function(item){
						if( Selector.match.apply(this, arguments) ){
							if( owner(item) ){
								return true;
							}
							// not the owner of the item
							return false;
						}
						return false;
					};
				}
			}

			// un anonyme?
			if( isAnonymous ){
				if( action == 'find' ){
					// un invité n'a pas le droit de chercher dans les tables suivantes
					if( [].contains(tableName) ){
						return false;
					}
					return true;
				}
				// un invité peut ajouter un utilisateur c'est tout
				if( action == 'insert' && tableName == 'user' ){
					return true;
				}
				return false;
			}
		}
	},

	// les actions du filesystem faut voir
	"filesystem": {
		"access": function(){
			// lorsque le client demande à effectué une action sur le filesystem
			// il agit toujours dans le dossier client/
			// faux, c'est juste quelque chose à vérifier mais pas à imposer

			//args[0] = 'client/' + args[0];
			return true;
		}
	}
};

// fichier qu'on met dans le cache du navigateur
config.appcache = {
	"js": "script",
	"css": "style",
	"img": "favicon.png"
};

module.exports = config;
