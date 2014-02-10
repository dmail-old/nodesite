function handleNativeError(error){
	require('fs').appendFileSync('./log/admin.log', '\n' + error.stack);
	throw error;
}

process.on('uncaughtException', handleNativeError);
setTimeout(function(){}, 1000 * 30);

require('core');
var ansi = require('ansi');
var Logger = require('logger');
var logger = Logger.new('./log/admin.log');
var serverLogger = Logger.new('./log/server.log');

/*
process.removeListener('uncaughtException', handleNativeError);
process.on('uncaughtException', function(error){
	logger.error(error);
	throw error;
});
*/

global.config = require('./config.js');

var Watcher = require('watcher');
var util = require('util');
var childProcess = require('child_process');
var Emitter = require('emitter');

var Nodeapp = Emitter.extend({
	args: null,
	process: null,
	ctime: null,
	processName: 'node',
	state: 'closed', // closed, started, restarting?
	standby: false,
	restarting: false,

	create: function(){
		this.args = Array.prototype.slice.call(arguments);
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

		this.process = childProcess.spawn(this.processName, this.args, {
			cwd: require('path').dirname(this.args[0]),
			stdio: [process.stdin, process.stdout, process.stderr, null, 'ipc']
		});
		this.ctime = Number(new Date());

		this.process.on('exit', this.onexit.bind(this));
		this.process.on('message', this.onmessage.bind(this));
		
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
			console.warn('\x1B[32m'+this.args[0]+' clean exit - waiting for changes before restart\x1B[0m');
			this.process = null;
			this.emit('exit');
		}
		else if( code === 2 ){
			console.warn('\x1B[32m'+this.args[0]+' restart asked \x1B[0m');
			this.start();
		}
		else{
			console.error('\x1B[1;31m'+this.args[0]+' crashed - waiting for file changes before starting...\x1B[0m');
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

/*

Je vais plutot envoyer le serveur à mon application
si l'application plante alors je répond aux requêtes par en maintenance tant que l'application ne redémarre pas non?

*/

var nodeServer = Nodeapp.new(process.cwd() + '/server/server.js');

nodeServer.on('start', function(){
	Watcher.watchAll(config.restartFiles, function(path){
		logger.info(ansi.magenta(path) + ' modified server restart');
		nodeServer.restart();
	});
});

nodeServer.on('stop', function(){
	var http = require('http');

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

nodeServer.start();