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
		"lang/fr"
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
	"site", "resize", "box", "popup", "selectionRectangle", "root", "menu", "tree", "selector", "editor"
];

// fichier js qu'on donne au client
config.js = [].concat(
	[
		"object", "regexp", "boolean", "number", "function", "string", "array"
	].prefix('core/'),
	[
		"object.util", "object.at",
		"random",
		"filter",
		"list",  "array.iterate", "array.find",
		"options", "chain", "memory", "path",
		"fx"
	].prefix('util/'),
	[
		"emitter", "emitterInterface",
		"event", "eventEmitter", "eventEmitterInterface", "eventListener",
		"nodeInterface", "nodeTraversal", "nodeFinder", "document",
	].prefix('lib/'),
	[
		"browser", "os",
		"event", "elementEmitter",
		"element", "element.properties",
		"element.styles", "element.measure",
		"element.keepIntoView", "element.find",
		"request"
	].prefix('browser/'),
	[
		"selection", "keynav", "rootkeynav", "shortcut"
	].prefix('ui/'),
	[
		"model", "view", "controller"
	],
	[
		"node", "menuoption", "menu",
	].prefix('model/'),
	[
		"selector", "node", "rootnode", "tree", "menuoption", "menu"
	].prefix('view/'),
	[

	].prefix('controller/'),
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

// ces fonctions sont appelées lorsqu'un client demande à éxécuté un script situé dans le dossier "action"
// les fonctions peuvent retourne true ou false pour authoriser le client à éxécuter l'action
config.actions = {
	"./": function(action, args){
		return true;
	},
	"filesystem": function(action, args){
		// lorsque le client demande à effectué une action sur le filesystem
		// il agit toujours dans le dossier client/
		// faux, c'est juste quelque chose à vérifier mais pas à imposer

		//args[0] = 'client/' + args[0];
		return true;
	}
};

config.socket = {
	// TODO origines autorisées pour les sockets
	"origins": "*:*"
};

config.db = {
	"host": "127.0.0.1",
	"port": 8125,
	// "name": "coderank",
	"user": "root",
	"password": ""
};

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
	"index": {"id":0, "public": true}
};

// fichier qu'on met dans le cache du navigateur
config.appcache = {
	"js": "script",
	"css": "style",
	"img": "favicon.png"
};

module.exports = config;
