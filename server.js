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
global.window = global;
global.FS = require('fs');
global.util = require('util');
global.Path = require('path');
global.config = require('./config.js');
global.lang = {};

['util', 'object', 'string', 'function', 'array', 'ns', 'item'].forEach(function(name){
	require(root + '/client/js/lib/core/' + name);
});

['object.at', 'finder', 'random', 'emitter'].forEach(function(name){
	require(root + '/client/js/lib/' + name);
});

var files = FS.readdirSync(root + '/lang/' + config.lang);
files.forEach(function(name){ require(root + '/lang/' + config.lang + '/' + name); });

require(root + '/require/color.js');
require(root + '/require/fs.extra.js');

// var Module = require('module');
// Module.prototype.require = function(path){
	// var start = process.hrtime();
	// var ret = Module._load(path, this);
	// var end = process.hrtime(start);
	// console.log(path, end[1]);
	// return ret;
// };
global.File = require(root + '/require/file.js');
global.FileInfo = require(root + '/require/fileinfo.js');
global.logger = require(root + '/require/logger.js');
//global.DB = require(root + '/db/db.js');

var http = require('http');
var Crypto = require('crypto');
var Cookie = require('./require/cookie.js');
var requestHandler = require('./require/requestHandler.js');

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
	var args = toArray(arguments, 2), callback = args.pop();
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

/*DB.start();
var User = DB.getTable('user');
var Players = DB.getTable('players');
var Items = DB.getTable('items');
var PlayerItems = DB.getTable('players.items');*/

// User.read(function(){ console.log(arguments); });

var Server = {
	create: function(){
		this.server = http.createServer();

		this.server.on('request', requestHandler);
		this.server.on('listening', function(){ });
		this.server.on('clientError', function(e){ console.log('client', e); });

		/*
		var socket = require('socket.io');
		var IO = socket.listen(this.server);

		IO.set('log level', 0);
		IO.set('authorization', this.authorize.bind(this));
		IO.sockets.on('connection', this.onClient.bind(this));
		*/
	},

	listen: function(port, host, callback){
		var server = this.server;

		function serverError(error){
			server.removeListener('error', serverError);
			server.removeListener('listen', serverListening);
			callback(error);
		}

		function serverListening(){
			server.removeListener('error', serverError);
			server.removeListener('listen', serverListening);
			callback();
		}

		server.on('listening', serverListening);
		server.on('error', serverError);

		server.listen(port, host);
	},

	close: function(callback){
		this.server.close(callback);
	},

	// lorsqu'une socket veut se connecter
	// on pourras lire les cookies afin de restaurer une session
	authorize: function(data, callback){
		callback(null, true);
	},

	onClient: function(socket){
		new Client(socket);
	}
};

var Client = NS('item').extend('client', {
	constructor: function(socket){
		// console.log(socket.handshake.headers.cookie);
		// grace au cookie de session, s'il existe on restaureras le compte de l'user
		// sinon on attendras une demande de login ou signin

		var session = Cookie.parse(socket.handshake.headers.cookie, 'session');

		/*if( session ){
			Session.get(session, function(error, data){
				if( error ){
					// pas de session
					return;
				}
				if( data ){

				}
				User.get()
			});
		}
		*/

		this.socket = socket;
		this.name = 'Admin';

		this.emit('news', 'Voici les dernière news');
		this.on('demand', this.demand.bind(this));

		logger.info(String.setType(this.name, 'name'), 'connected to the server');
	},

	toString: function(){
		return this.name;
	},

	on: function(){
		this.socket.on.apply(this.socket, arguments);
		return this;
	},

	emit: function(){
		this.socket.emit.apply(this.socket, arguments);
		return this;
	},

	demand: function(action){
		var args = toArray(arguments, 1);

		if( action == 'join' || action == 'leave' ){
			this[action].apply(this, args);
			return;
		}

		logger.info(String.setType(this.name, 'name') + 'demand' + String.setType(action, 'function'));

		var file = new File(root + '/action/' + action + '.js');

		if( !file.existsSync() ){
			// je fais rien
			logger.warn(action + 'n\'est pas une action connue');
		}
		else{
			args = [this].concat(args);
			// j'éxécute le code de ce fichier
			var script = require(file.path);
			script.apply(null, args);
		}
	},

	join: function(room, callback){
		logger.info(String.setType(this.name, 'name'), 'ask to join', String.setType(room, 'function'));

		this.socket.join(room);

		// dit aux autres que celui-ci vient d'arriver
		this.socket.broadcast.to(room).emit(room+'/join');

		// dit au client qu'il a été accepté
		callback(true);
	},

	leave: function(room, callback){
		logger.info(String.setType(this.name, 'name'), 'ask to leave', String.setType(room, 'function'));

		this.socket.leave(room);

		// dit aux autres qu'il est parti
		this.socket.broadcast.to(room).emit('leave');

		// dit au client qu'il a bien été enlevé
		callback(true);
	},

	memberOf: function(group){
		var room = this.socket.manager.rooms[group];
		return room && room.contains(this.socket.id);
	}
});

// var server = http.createServer();
// server.listen(config.port, config.host);

Server.create();
Server.listen(config.port, config.host, function(error){
	if( error ){
		if( error.code == 'EADDRINUSE' ){
			error.message = 'Port ' + config.port + ' already in use';
		}
		throw error;
	}

	logger.info('Server running at '+String.setType(config.host, 'b') + ':' + String.setType(config.port, 'c'));
});
