process.on('uncaughtException', function handleNativeError(error){
	require('fs').appendFileSync('./log/error.log', error.stack + '\n');
	console.log(error.stack); // no need to throw
});
setTimeout(function(){}, 1000 * 60 * 30);

var LogStream = require('LogStream');
var logger = LogStream.new();//('./log/admin.log');

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
var config = require('./app/config');

// server process
if( true ){	
	var serverProcess = NodeProcess.new(process.cwd() + '/app/server/server.js');

	serverProcess.console = logger;
	serverProcess.setRestartFiles(
		"./app/node_modules",
		"./app/config/index.js",
		"./app/server/server.js",
		"./app/server/node_modules",
		"./app/server/lang/fr"
	);

	/*
	serverProcess.on('listening', function(){
		logger.info('Server listening {host}:{port}', config.host, config.port);
	});
	*/

	serverProcess.on('crash', function(){		
		var http = require('http');
		var emergencyServer = http.createServer(function(request, response){
			response.writeHead(200, {'Content-Type': 'text/plain'});
			response.write('Server down');
			response.end();
		});

		emergencyServer.listen(config.port, config.host, function(){
			logger.warn('Emergency server listening {host}:{port}', config.host, config.port);

			serverProcess.restart = function(){
				emergencyServer.close(function(){
					logger.info('Emergency server closed');
					serverProcess.restart = NodeProcess.restart;
					serverProcess.restart();
				});
			};
		});
	});

	serverProcess.start();
}

// test process
if( true ){
	var testProcess = NodeProcess.new(process.cwd() + '/node_modules/nodetest/run.js', '../../../nodesite');
	
	testProcess.console = logger;
	testProcess.setRestartFiles(
		"./node_modules/nodetest"
	);

	testProcess.start();
}

// database process (maybe will be launched by server)