/* global Path */

Array.prototype.prefix = function(prefix){
	return this.map(function(value){ return prefix + value; });
};

var config = {
	// ces fichiers ou tout fichier contenu dans ces dossiers font redémarrer le serveur
	"serverFiles": [
		"config.js",
		"server.js",
		"module",
		//"db",
		"client/js/lib",
		"lang/fr",
		"action",
	],
	"local": true,
	// lorsque une erreur se produit elle est affichée même si l'utilisateur n'est pas connu
	"debug": true,
	"protocol": "http",
	"host": "127.0.0.1",
	"port": 8124,
	// encodage des pages
	"encoding": "utf8",
	"lang": "fr"
};

// fichier css qu'on donne au client
config.css = [
	"site", "resize", "box", "popup", "selectionRectangle", "node", "root", "menu", "tree", "selector", "editor"
];

// fichier js qu'on donne au client
config.js = [].concat(
	[
		"object", "regexp", "boolean", "number", "function", "string", "array"
	].prefix('core/'),
	[
		// null, regexp, array doivent être avant object sinon objectselector prévaut
		"selector", "arraySelector", "booleanSelector", "functionSelector", "numberSelector",
		"nullSelector", "regExpSelector", "objectSelector", "stringSelector"
	].prefix('selector/').concat(
	[
		"object.util",
		"random",
		"list",  "array.iterate", "array.find",
		"options", "chain", "memory", "path",
		"weakMap",
		"fx"
	]).prefix('util/'),
	[
		"emitter", "emitterInterface",
		"event", "eventEmitter", "eventEmitterInterface", "eventListener",
		"nodeInterface", "nodeTraversal", "nodeIterator", "nodeFinder", "document"
	].prefix('lib/'),
	[
		"object.watch", "objectChangeEmitter", "arrayObserver"
	].prefix('observer/').concat(
	[
		"lexer", "part", "path", "partObserver", "pathObserver"
	]).prefix('objectPath/'),
	[
		"browser", "os",
		"event", "elementEmitter",
		"element", "element.properties",
		"element.styles", "element.measure",
		"element.keepIntoView", "element.find",
		"request", "cookie"
	].prefix('browser/'),
	[
		"parser", "linker", "attributeLinker", "linkerListLinker", "subTemplateLinker"
	].prefix('parser/').concat(
	[
		"node.bind", "HTMLTemplateElement", "template"
	]).prefix('mdv/'),
	/*
	[
		"selection", "keynav", "rootkeynav", "shortcut", "editable"
	].prefix('ui/'),
	*/
	/*
	rewrite needed
	[
		"fx.scroll",
		"surface",
		"element.wrapVectors",
		"box",
		"popup",
		"popup.valid",
		"selectionRectangle"
	].prefix('view/box/'),
	*/
	"app"
);


/*

ces fonctions sont appelées lorsqu'une requête demande à éxécuté un script situé dans le dossier "action"

return true -> authorise à éxécuter l'action
return false -> empêche d'éxécuter l'action
return error -> empêche de faire l'action et donne des précisions sur pourquoi

*/
config.actions = {
	// les actions à la racine sont toutes autorisé
	"./": function(action, args){
		return true;
	},

	// les actions de la BDD
	"database": function(action, args){
		var tableName = args[0], isAnonymous = false, isUser = false, isAdmin = false, user = this.user;

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
				var selector = args[1] = NS.Selector.new(args[1]);
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
					if( NS.Selector.match.apply(this, arguments) ){
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

	},

	// les actions du filesystem faut voir
	"filesystem": function(action, args){
		// lorsque le client demande à effectué une action sur le filesystem
		// il agit toujours dans le dossier client/
		// faux, c'est juste quelque chose à vérifier mais pas à imposer

		//args[0] = 'client/' + args[0];
		return true;
	}
};

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

config.getMimetype = function(path){
	return config.mimetypes[Path.extname(path).substr(1)] || config.mimetype;
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
	"index": {"id": 0, "public": true}
};

// fichier qu'on met dans le cache du navigateur
config.appcache = {
	"js": "script",
	"css": "style",
	"img": "favicon.png"
};

module.exports = config;
