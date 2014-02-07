/*

Je vais plutot envoyer le serveur à mon application
si l'application plante alors je répond aux requêtes par en maintenance tant que l'application ne redémarre pas non?

*/

var FS = require('fs');

function handleError(error){
	FS.appendFileSync('error.log', '\n' + error.stack);
	throw error;
}

process.on('uncaughtException', handleError);
setTimeout(function(){}, 1000 * 30);

global.root = process.cwd();
global.config = require('./config.js');

var
	Watcher = require('watcher'),
	util = require('util'),
	platform = process.platform,
	isWindows = platform === 'win32',
	childProcess = require('child_process'),
	EventEmitter = require('events').EventEmitter
;

var App = function(){
	this.args = Array.prototype.slice.call(arguments);
	this.process = null;
	this.ctime = null;
};

util.inherits(App, EventEmitter);

Object.append = function(source, append){
	for(var key in append){
		source[key] = append[key];
	}
	return source;
};

Object.append(App.prototype, {
	processName: 'node',
	state: 'closed', // closed, started, restarting?

	start: function(){
		if( this.standby ){
			this.standby.close(function(){
				console.log('Serveur de secours stoppé');
				delete this.standby;
				this.start();
			}.bind(this));
			return;
		}

		this.process = childProcess.spawn(this.processName, this.args, {
			cwd: require('path').dirname(this.args[0]),
			stdio: [null, null, null, null, 'ipc']
		});
		this.ctime = Number(new Date());

		this.process.stdout.on('data', function(data){ process.stdout.write(data); });
		this.process.stderr.on('data', function(data){ process.stderr.write(data); });
		this.process.on('exit', this.onexit.bind(this));
		this.process.on('message', this.onmessage.bind(this));

		// pinched from https://github.com/DTrejo/run.js - pipes stdin to the child process - cheers DTrejo ;-)
		process.stdin.resume();
		process.stdin.setEncoding('utf8');
		process.stdin.pipe(this.process.stdin);

		this.emit('start');
	},

	restart: function(){
		if( this.process ){
			if( isWindows ){
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
		this.process.kill(signal);
		this.emit('kill', signal);
	},

	onexit: function(code, signal){
		if( this.restarting ){
			delete this.restarting;
			signal = 'SIGUSR2';
		}
		// this is nasty, but it gives it windows support
		if( isWindows && signal == 'SIGTERM' ) signal = 'SIGUSR2';

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

var server = new App(root + '/server/server.js');

function restart(path){
	console.log('\033[35m'+ path +'\033[39m modified server restart');
	server.restart();
}

server.on('start', function(){
	Watcher.watchAll(config.restartFiles, restart);
});

server.on('stop', function(){
	var http = require('http');

	// répond à toutes les requêtes par 'serveur en maintenance'
	server.standby = http.createServer(function(request, response){
		response.writeHead(200, {'Content-Type': 'text/plain'});
		response.write('Serveur en maintenance');
		response.end();
	});
	server.standby.listen(config.port, config.host, function(){
		console.log('Serveur de secours lancé');
	});
});

server.start();

