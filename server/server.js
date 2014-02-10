/*

TODO

Modification du nom, password etc
Mise en place de compte utilisateur, connexion, inscription, déconnexion

*/

global.FS = require('fs');
global.util = require('util');
global.Path = require('path');
global.ROOTPATH = '..';
global.SERVERPATH = '.';
global.CLIENTPATH = global.ROOTPATH + global.Path.sep + 'client';
global.config = require(global.ROOTPATH + '/config.js');
global.lang = {};

require('core');
require('random');
require('objectPath/pathAccessor');

global.File = require('file');
global.FileInfo = require('fileinfo');
global.DB = require('database');
DB.dirPath = './temp';

var files = FS.readdirSync('./lang/' + config.lang);
files.forEach(function(name){ require('./lang/' + config.lang + '/' + name); });

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
	var hash = require('crypto').createHash('md5');
	return hash.update(string).digest('hex');
};

// retourne une chaine unique
global.generateUID = function(){
	// gènère la chaîne à laquelle on ajoute process.hrtime()[1] (current timestamp in ms) pour la rendre unique
	return global.md5(String.random(16) + process.hrtime()[1] + String.random(16));
};

Error.stackTraceLimit = 20;

var ansi = require('ansi');
var Demand = require('demand');
var server = {
	http: require('http'),
	logger: require('logger').new(),

	onrequest: function(request, response){
		var demand = Demand.new(request, response);

		demand.getLevel = function(){
			var status = this.status, level;

			if( status >= 500 ){
				level = 'error';
			}
			if( status >= 400 ){
				level = 'warn';
			}
			level = 'info';

			return level;	
		};

		demand.getStatusStyle = function(){
			var status = this.statusCode;

			if( status >= 500 ){
				return 'red';
			}
			if( status >= 400 ){
				return 'yellow';
			}
			if( status >= 300 ){
				return 'blue';
			}
			if( status >= 200 ){
				return 'green';
			}		
			return 'inherit';
		};

		demand.getLogMessage = function(){
			var message = '';

			if( this.user ){
				message+= '[' + this.user.name + '] ';
			}

			message+= ansi.magenta(this.method);
			message+= ' ' + ansi.setStyle(this.status, this.getStatusStyle());
			message+= ' ' + ansi.magenta(this.url.pathname);

			if( this.args ){
				message+= ' ' + ansi.bold(this.args);
			}

			var time = response.getHeader('x-response-time');
			if( time ){
				message+= ' ' + ansi.bold(time + 'ms');
			}

			return message;
		};

		demand.emitter.on('response', function(){
			if( this.hasHeader('content-type') ){
				var contentType = this.getContentType();
				if( !this.accept(contentType) ){
					server.logger.warn(contentType + ' not in accept header');
				}
			}
			
			server.logger.log(
				this.getLevel(),
				this.getLogMessage()
			);
		});

		demand.start();
	},

	onclientError: function(e){
		server.logger.error('client request error', e);
	},

	open: function(){
		this.connection = this.http.createServer();

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
	
	server.logger.info('Server running at %s:%s', ansi.grey(config.host), ansi.red(config.port));
});

