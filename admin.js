function handleNativeError(error){
	require('fs').appendFileSync('./log/error.log', error.stack + '\n');
	console.log(error.stack);
	// no need to trhow
	//throw error;
}

process.on('uncaughtException', handleNativeError);
setTimeout(function(){}, 1000 * 60 * 30);

/*
au lieu de ça, ce qui il faudrais qu'emitter se trouve dans /node_modules et donc accessible partout
par contre faudrais que le client puisse y accéder et donc établir une liste de module accessible au client
pour le moment on touche rien xD
*/
var APP_MODULE_PATH = './app/node_modules';
var instance = require(APP_MODULE_PATH + '/Object.instance');

var ansi = require('ansi');
var Logger = require('LogStream');
var logger = Logger.new('./log/admin.log');

logger.styles.path = {color: 'magenta'};

var EventEmitter = require('events').EventEmitter;

var Nodeapp = instance.extend(EventEmitter.prototype, {
	childProcess: require('child_process'),
	name: 'nodeProcess',
	args: null,
	process: null,
	ctime: null,
	processName: 'node',
	state: 'closed', // closed, started, restarting?
	logger: null,
	standby: false,
	restarting: false,

	init: function(){
		this.constructor.apply(this);
		this.args = Array.apply(Array, arguments);
		this.args[0] = require('path').normalize(this.args[0]);
	},

	start: function(){
		if( this.standby ){
			this.standby.close(function(){
				logger.info('Serveur de secours stoppé');
				this.standby = false;
				this.start();
			}.bind(this));
			return;
		}

		this.process = this.childProcess.spawn(this.processName, this.args, {
			cwd: require('path').dirname(this.args[0]),
			stdio: ['pipe', 'pipe', 'pipe', 'ipc']
		});
		this.ctime = Number(new Date());

		//stdio['pipe', 'pipe', 'pipe', 'ipc']
		//stdio: [process.stdin, process.stdout, process.stderr, 'ipc']

		this.process.on('exit', this.onexit.bind(this));
		this.process.on('message', this.onmessage.bind(this));

		this.process.stdout.pipe(logger, {end: false});
		this.process.stderr.pipe(logger, {end: false});
		
		this.state = 'started';
		this.emit('start');
	},

	isWindows: function(){
		return process.platform === 'win32';
	},

	restart: function(){
		if( this.process ){
			if( this.isWindows() ){
				this.restarting = true;
				this.kill();
			}
			else{
				this.kill('SIGUSR2');
			}
		}
		else{
			this.start();
		}
	},

	kill: function(signal){
		this.emit('kill', signal);
		this.process.kill(signal);
	},

	onexit: function(code, signal){
		if( this.restarting ){
			this.restarting = false;
			signal = 'SIGUSR2';
		}
		// this is nasty, but it gives it windows support
		if( this.isWindows() && signal == 'SIGTERM' ) signal = 'SIGUSR2';

		// exit the monitor, but do it gracefully
		if( signal == 'SIGUSR2' ){
			this.start();
		}
		// clean exit - wait until file change to restart
		else if( code === 0 ){
			logger.info('{path} clean exit - waiting for file changes before restart', this.args[0]);
			this.process = null;
			this.emit('exit');
		}
		else if( code === 2 ){
			logger.warn('{path} is asking to restart', this.args[0]);
			this.start();
		}
		else{
			logger.error('{path} crashed - waiting for file changes before restarting');
			this.process = null;
			this.emit('stop');
		}
	},

	send: function(message, handle){
		this.process.send(message, handle);
	},

	onmessage: function(message, handle){
		if( typeof message == 'string' ){

		}
	}
});

var nodeServer = Nodeapp.new(process.cwd() + '/app/server/server.js');

nodeServer.logger = logger;

// ces fichiers ou tout fichier contenu dans ces dossiers font redémarrer le serveur
var restartFiles = [
	"./app/node_modules",
	"./app/config/index.js",
	"./app/server/server.js",
	"./app/server/node_modules",
	//"db",
	"./app/server/lang/fr"
];

var Watcher = require('watcher');
nodeServer.once('start', function(){
	Watcher.watchAll(restartFiles, function(path){
		logger.info('{path} modified server restart', path);
		nodeServer.restart();
	});
});

nodeServer.on('stop', function(){
	var http = require('http');
	var config = require('./app/config');

	// répond à toutes les requêtes par 'serveur en maintenance'
	nodeServer.standby = http.createServer(function(request, response){
		response.writeHead(200, {'Content-Type': 'text/plain'});
		response.write('Serveur en maintenance');
		response.end();
	});
	nodeServer.standby.listen(config.port, config.host, function(){
		logger.warn('Serveur de secours lancé');
	});
});

logger.styles['version'] = {color: 'yellow'};
logger.styles['platform'] = {color: 'blue'};
logger.info('Node.js version {version} running on {platform}', process.version, process.platform);
//nodeServer.start();