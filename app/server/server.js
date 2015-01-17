/* global FS, util, Path, ABS_PATH, ROOT_PATH, APP_PATH, SERVER_PATH, CLIENT_PATH */

//Error.stackTraceLimit = 20;

global.Path = require('path');
global.ROOT_PATH = Path.resolve(process.cwd(), '../../');
global.APP_PATH = ROOT_PATH + Path.sep + 'app';
global.SERVER_PATH = APP_PATH + Path.sep + 'server';
global.CLIENT_PATH = APP_PATH + Path.sep + 'client';

global.config = require(APP_PATH + Path.sep + 'config');

require('proto');
require('property');
Object.define(global, require('function'));
global.lang = global.loadLanguageDirectory(SERVER_PATH + '/lang/' + config.lang);

var LogStream = require('LogStream');
var Router = require('Router');

var logger = new LogStream();
var server = {
	http: require('http'),
	logger: logger,
	router: new Router({
		allowErrorTrace: config.debug
	}),

	emit: function(type){
		if( typeof process.send == 'function' ){
			process.send({
				type: type
			});
		}
	},

	onrequest: function(request, response){
		var requestHandler = server.router.createRequestHandler(request, response);
		requestHandler.next();
	},

	onclientError: function(e){
		server.logger.error(e.stack);
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

router.use('timeout', 1 * 1000);
router.use('cookie');
router.use('requestLength');
router.use('requestMD5');
router.use('requestNegotiation', { /*defaultAcceptedCharset: config.charset,*/defaultCharset: config.charset});
router.use('requestBody');
router.use('requestJSON');
router.use('requestParams');
router.use('methodOverride');
router.use('session');
router.use('logger', server.logger);
router.use('responseNegotiation', {defaultCharset: config.charset});

router.use('responseTime');
router.use('cors');
router.use('responseLength'); // doit être après responseNegotiation
router.use('page');
router.use('module', {rootFolder: global.ROOT_PATH, clientFolder: global.APP_PATH});
router.use('file', global.CLIENT_PATH);
router.use('errorHandler');

//router.use('helloworld');

server.open();

logger.registerStyles({
	'host': 'grey',
	'port': 'red'
});

console.log('{name}'.render({name: 'damien'}));

server.listen(config.port, config.host, function(error){
	if( error ){
		if( error.code == 'EADDRINUSE' ){
			error.message = 'Port ' + config.port + ' already in use';
		}
		throw error;
	}

	logger.info('Server listening {host}:{port}', {
		host: config.host,
		port: config.port
	});
	server.emit('listening');
});