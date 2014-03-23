/* global FS, util, Path, ABS_PATH, ROOT_PATH, APP_PATH, SERVER_PATH, CLIENT_PATH */

/*

on va créer un dépot git pour emitter, pour objectPath, pour objectObserver, pour elementEmitter, pour module
faudras aussi finir router un de ses jours et créer un dépot pour lui aussi

Pour utiliser gitsubmodule

Dans le superprojet je me met la ou je veux ajouter le sous projet

git submodule add [url]

Toute modification, commit etc doit se faire dans le sous-projet
Pour récup tout ça je me met dans le superprojet et je fais

git submodule foreach git pull origin master
or
git submodule --remote --merge

(see http://stackoverflow.com/questions/5828324/update-git-submodule)

INCONVENIENT MAJEUR: j'ai besoin d'internet, je suis sur que y'a moyen de s'en passer mais je sais pas comment du tout
*/

Error.stackTraceLimit = 20;

global.FS = require('fs');
global.Path = require('path');

global.ROOT_PATH = Path.resolve(process.cwd(), '../../');
global.APP_PATH = ROOT_PATH + Path.sep + 'app';
global.SERVER_PATH = APP_PATH + Path.sep + 'server';
global.CLIENT_PATH = APP_PATH + Path.sep + 'client';

global.config = require(APP_PATH + Path.sep + 'config.js');

require('core');
require('random/random');
require('objectPath/pathAccessor');

Object.append(global, require('functions'));
global.lang = global.loadLanguageDirectory(SERVER_PATH + '/lang/' + config.lang);

global.File = require('file');
global.FileInfo = require('fileinfo');
global.DB = require('database');
DB.dirPath = './temp';

//example à garder, voici comment faire se succéder des streams


var fileStream = require('fs').createReadStream('test.txt');
var stream = new require('stream').Duplex();
var stream_a = new require('stream').Duplex();
var stream_b = new require('stream').Duplex();

stream._read = function(n){
	return this.read(n);
};
stream._write = function(chunk){
	this.push(chunk);
};
stream_a._read = function(n){
	return this.read(n);
};
stream_a._write = function(chunk){
	console.log('stream_a got', chunk.toString());
	this.push(chunk.toString() + 'stream_a');
};
stream_b._read = function(n){
	return this.read(n);
};
stream_b._write = function(chunk){
	console.log('stream_b got', chunk.toString());
	this.push(chunk.toString() + 'stream_b');
};

stream.on('data', function(chunk){
	console.log('stream got', chunk.toString());
});

stream.on('error', function(){
	console.log('stream error');
});

stream_a.on('error', function(){
	console.log('stream_a error');
});
fileStream.on('error', function(){
	console.log('filestream error');
});

//stream_b.pipe(stream);
//stream_a.pipe(stream_b);
//fileStream.pipe(stream_a);
//stream_a.emit('error', new Error());

var ComputedStream = require('computedStream');
var computedStream = new ComputedStream();

computedStream.chain(fileStream);
computedStream.chain(stream_a);
computedStream.chain(stream_b);

computedStream.on('data', function(data){
	console.log('computedStream', data.toString());
});

computedStream.resolve();

var ansi = require('ansi');
var server = {
	http: require('http'),
	logger: require('logger').new(),
	router: require('router'),

	onrequest: function(request, response){
		this.router.new(request, response);//.start();
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
	authorize: function(data, callback){
		callback(null, true);
	},

	onClient: function(socket){
		//new Client(socket);
	}
};

var router = server.router;
// use basic services
router.use('bodyReader');
router.use('cookieParser');
router.use('params');
router.use('methodOverride');
router.use('jsonParam');
router.use('responseTime');
router.use('session');
router.use('logger', server.logger);
router.use('cors');
router.use('page');
router.use('file');
router.use('errorHandler');

router.use('bodyWriter');

router.allowErrorTrace = config.debug;
//router.Request.defaultAcceptedCharset = config.charset;
router.Request.charset = config.charset;
router.Response.charset = config.charset;

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