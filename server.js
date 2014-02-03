/*


TODO

- session

Modification du nom, password etc
Mise en place de compte utilisateur, connexion, inscription, déconnexion

Comment reconnaitre un utilisateur identifié? cookie pour le moment
coté serveur on recrée toujours un user en fonction de ce que la requête envoie comme id de session
comment crée un id de session coté client ou serveur? normalement on écrit le cookie coté serveur
mais on peut très bien imaginé l'écrire coté client lors de la connexion / inscription

*/


global.root = process.cwd();
global.window = global;
global.FS = require('fs');
global.util = require('util');
global.Path = require('path');
global.config = require('./config.js');
global.lang = {};
global.NS = {};

['object', 'boolean', 'number', 'regexp', 'string', 'function', 'array'].forEach(function(name){
	require(root + '/client/js/core/' + name);
});

['random'].forEach(function(name){
	require(root + '/client/js/util/' + name);
});

['lexer', 'part', 'path'].forEach(function(name){
	require(root + '/client/js/objectPath/' + name);
});

['emitter'].forEach(function(name){
	require(root + '/client/js/lib/' + name);
});

var files = FS.readdirSync(root + '/lang/' + config.lang);
files.forEach(function(name){ require(root + '/lang/' + config.lang + '/' + name); });

require(root + '/module/color.js');
require(root + '/module/fs.extra.js');

global.File = require(root + '/module/file.js');
global.FileInfo = require(root + '/module/fileinfo.js');
global.logger = require(root + '/module/logger.js');
var http = require('http');
var Crypto = require('crypto');

global.DB = require(root + '/module/db');
DB.dirPath = './temp';

global.applyScript = function(path, bind, args, callback){
	if( typeof callback != 'function' ){
		throw new Error('callback expected');
	}

	var module, count;

	try{
		module = require(path);
	}
	catch(e){
		return callback(e);
	}

	if( typeof module != 'function' ){
		return callback(new Error('script at ' + path + ' is not callable'));
	}

	args = args || [];
	count = module.length - 1;

	if( count > 0 && count != args.length ){
		// if( Function.argumentNames(module)[count + 1] == 'callback' ){
		return callback(new Error(path + ' expect exactly ' + count + ' arguments ' + args.length + ' given'));
		// }
	}

	args = [].concat(args);
	args.push(callback);

	try{
		module.apply(bind, args);
	}
	catch(e){
		return callback(e);
	}
};

global.callScript = function(path, bind){
	var args = Array.slice(arguments, 2), callback = args.pop();
	return this.applyScript(path, bind, args, callback);
};

global.md5 = function(string){
	var hash = Crypto.createHash('md5');
	return hash.update(string).digest('hex');
};

// retourne une chaine unique
global.generateUID = function(){
	// gènère la chaîne à laquelle on ajoute process.hrtime()[1] (current timestamp in ms) pour la rendre unique
	return global.md5(String.random(16) + process.hrtime()[1] + String.random(16));
};

Error.stackTraceLimit = 20;

String.defineType('name', {color: 'magenta', font: 'bold'});
String.defineType('path', {color: 'magenta', font: 'bold'});
String.defineType('time', {color: 'grey', font: 'bold'});

String.defineType('green', {color: 'green'});
String.defineType('blue', {color: 'cyan'});
String.defineType('yellow', {color: 'yellow'});
String.defineType('pink', {color: 'magenta'});

var server = {
	onrequest: function(request, response){
		require(root + '/module/route/route.js').new(request, response).start();
	},

	onclientError: function(e){
		console.log('client error', e);
	},

	open: function(){
		this.connection = http.createServer();

		this.connection.on('request', this.onrequest);
		//this.connection.on('listening', this.onlistening);
		this.connection.on('clientError', this.onclientError);

		/*
		var socket = require('socket.io');
		var IO = socket.listen(this.server);

		IO.set('log level', 0);
		IO.set('authorization', this.authorize.bind(this));
		IO.sockets.on('connection', this.onClient.bind(this));
		*/
	},

	listen: function(port, host, callback){
		var connection = this.connection;

		function serverError(error){
			connection.removeListener('error', serverError);
			connection.removeListener('listen', serverListening);
			callback(error);
		}

		function serverListening(){
			connection.removeListener('error', serverError);
			connection.removeListener('listen', serverListening);
			callback();
		}

		connection.on('listening', serverListening);
		connection.on('error', serverError);
		connection.listen(port, host);
	},

	close: function(callback){
		this.connection.close(callback);
	},

	// lorsqu'une socket veut se connecter
	// on pourras lire les cookies afin de restaurer une session
	authorize: function(data, callback){
		callback(null, true);
	},

	onClient: function(socket){
		//new Client(socket);
	}
};

server.open();
server.listen(config.port, config.host, function(error){
	if( error ){
		if( error.code == 'EADDRINUSE' ){
			error.message = 'Port ' + config.port + ' already in use';
		}
		throw error;
	}

	logger.info('Server running at '+String.setType(config.host, 'b') + ':' + String.setType(config.port, 'c'));
});

