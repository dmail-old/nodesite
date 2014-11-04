process.on('uncaughtException', function handleNativeError(error){
	require('fs').appendFileSync('./log/error.log', error.stack + '\n');
	console.log(error.stack); // no need to throw
});
setTimeout(function(){}, 1000 * 60 * 30);


var config = require('./app/config');
var LogStream = require('LogStream');
var logger = LogStream.new(/*'./log/admin.log'*/);

logger.Log.registerStyles({
	'version': 'yellow',
	'platform': 'blue',
	'path': 'magenta'
});

logger.info('node.js {version} on {platform}', process, function(){
	var readline = require('readline'), interface = readline.createInterface(process.stdin, process.stdout);

	interface.setPrompt('> ');
	interface.prompt();
	interface.on('line', function(line){
		var code = line.trim();

		try{
			console.log(eval(code));
		}
		catch(e){
			console.log(e.stack);
		}

		interface.prompt();
	});
	interface.on('close', function(){
		process.exit(0);
	});
});

var NodeProcess = require('NodeProcess');

// server process
if( !true ){
	var Watcher = require('watcher');
	var http = require('http');
	var serverProcess = NodeProcess.new(process.cwd() + '/app/server/server.js');

	var emergencyServer = http.createServer(function(request, response){
		response.writeHead(200, {'Content-Type': 'text/plain'});
		response.write('Server down');
		response.end();
	});

	serverProcess.once('start', function(){
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
			
			if( emergencyServer.listening ){
				emergencyServer.close(function(){
					emergencyServer.listening = false;
					logger.info('Emergency server closed');
					serverProcess.restart();
				});
			}
			else{
				serverProcess.restart();
			}		
		});
	});

	serverProcess.on('stop', function(){
		logger.info('{path} graceful stop - waiting for file changes before restart', this.args[0]);
	});

	serverProcess.on('crash', function(){
		logger.error('{path} crashed - waiting for file changes before restarting', this.args[0]);
		emergencyServer.listen(config.port, config.host, function(){
			emergencyServer.listening = true;
			logger.warn('Emergency server listening {host}:{port}', config.host, config.port);
		});
	});

	serverProcess.on('listening', function(){
		//logger.info('Server listening {host}:{port}', config.host, config.port);
	});

	serverProcess.start();
}

// test process
if( !true ){
	var testProcess = NodeProcess.new(process.cwd() + '/node_modules/unitTest/runTest.js', '../../../nodesite');
	testProcess.start();
}

// database process (maybe will be launched by server)