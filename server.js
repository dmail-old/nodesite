/* global DB */

/*

NOTE



TODO

- une erreur 500 on renvoit sur une page d'erreur
- websocket
- tester si socket.io permet de passer des erreurs au client
- session

Modification du nom, password etc
Mise en place de compte utilisateur, connexion, inscription, déconnexion en utilisant AJAX pour le moment

FIX

*/
global.root = process.cwd();
global.FS = require('fs');
global.util = require('util');
global.Path = require('path');
global.config = require('./config.js');
global.lang = {};
global.NS = {};

['object', 'string', 'boolean', 'number', 'regexp', 'function', 'array'].forEach(function(name){
	require(root + '/client/js/lib/core/' + name);
});

['object.at', 'filter', 'random', 'emitter'].forEach(function(name){
	require(root + '/client/js/lib/' + name);
});

var files = FS.readdirSync(root + '/lang/' + config.lang);
files.forEach(function(name){ require(root + '/lang/' + config.lang + '/' + name); });

require(root + '/module/color.js');
require(root + '/module/fs.extra.js');

global.File = require(root + '/module/file.js');
global.FileInfo = require(root + '/module/fileinfo.js');
global.logger = require(root + '/module/logger.js');
//global.DB = require(root + '/db/db.js');
var http = require('http');
var Crypto = require('crypto');
var Cookie = require('./module/cookie.js');

global.applyScript = function(path, bind, args, callback){
	if( typeof callback != 'function' ) throw new Error('callback expected');

	var module, count;

	try{
		module = require(path);
	}
	catch(e){
		return callback(e);
	}

	if( typeof module != 'function' ) return callback(new Error('script at ' + path + ' is not callable'));

	args = args || [];
	count = module.length - 1;

	if( count > 0 && count != args.length ){
		// if( Function.argumentNames(module)[count + 1] == 'callback' ){
		return callback(new Error(path + ' expect exactly ' + count + ' arguments ' + args.length + ' given'));
		// }
	}

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

// retourne une chaine unique
global.generateUID = function(){
	var microtime = process.hrtime()[1], md5 = Crypto.createHash('md5');
	// gènère la chaîne à laquelle on ajoute microtime() pour la rendre unique
	md5.update(String.random(16) + microtime + String.random(16));
	return md5.digest('hex');
};

Error.stackTraceLimit = 20;

String.defineType('name', {color: 'magenta', font: 'bold'});
String.defineType('path', {color: 'magenta', font: 'bold'});

var server = {
	onrequest: function(request, response){
		require(root + '/module/response.js').new(request, response);
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

