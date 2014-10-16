function handleNativeError(error){
	require('fs').appendFileSync('./log/error.log', error.stack + '\n');
	console.log(error.stack);
	// no need to trhow
	//throw error;
}

process.on('uncaughtException', handleNativeError);
setTimeout(function(){}, 1000 * 60 * 30);

var proto = require('proto');
var ansi = require('ansi');
var LogStream = require('LogStream');
var logger = LogStream.new('./log/admin.log');

logger.styles.path = {color: 'magenta'};

var EventEmitter = require('events').EventEmitter;

var Nodeapp = proto.createFrom(EventEmitter.prototype, {
	Path: require('path'),
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
		this.args[0] = this.Path.normalize(this.args[0]);
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
			cwd: this.Path.dirname(this.args[0]),
			stdio: ['pipe', 'pipe', 'pipe', 'ipc']
		});
		this.ctime = Number(new Date());

		this.process.on('uncaughtException', function(e){
			console.log('here?');
		});

		//stdio['pipe', 'pipe', 'pipe', 'ipc']
		//stdio: [process.stdin, process.stdout, process.stderr, 'ipc']

		this.process.on('exit', this.onexit.bind(this));
		this.process.on('message', this.onmessage.bind(this));

		// ceci aussi peut écrire du texte non formatté par logger si j'écris console.log
		this.process.stdout.pipe(logger, {end: false});
		// ceci écriras tout le temps du texte brut lorsqu'une erreur survient
		this.process.stderr.pipe(logger, {end: false});
		// c'est incompatible avec la système actuel de logger qui doit émetter des objects etc
		// donc il faudrais transformer ce texte en quelque chose d'autre
		
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
			logger.error('{path} crashed - waiting for file changes before restarting', this.args[0]);
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

var Watcher = require('watcher');
nodeServer.once('start', function(){
	// ces fichiers ou tout fichier contenu dans ces dossiers font redémarrer le serveur
	var restartFiles = [
		"./app/node_modules",
		"./app/config/index.js",
		"./app/server/server.js",
		"./app/server/node_modules",
		//"db",
		"./app/server/lang/fr"
	];

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

nodeServer.start();

//require('fs').createReadStream('./notes.txt').pipe(logger, {end: false});

var readline = require('readline'), rl = readline.createInterface(process.stdin, process.stdout);

rl.setPrompt('admin> ');
rl.prompt();
rl.on('line', function(line){
	var code = line.trim();

	try{
		console.log(eval(code));
	}
	catch(e){
		console.log(e.stack);
	}

	rl.prompt();
}).on('close', function() {
	console.log('Have a great day!');
	process.exit(0);
});
