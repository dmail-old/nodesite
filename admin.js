/*
Il y a un bug lorsque :

server process ET test process sont lancé
un fichier fait redémarrer les deux process (même si je met un timeout)
lorsque nodeprocess restart est log, parfois c'est log avec de la couleur

*/

process.on('uncaughtException', function handleNativeError(error){
	require('fs').appendFileSync('./log/error.log', error.stack + '\n');
	console.log(error.stack); // no need to throw
});

process.stdin.resume(); // keep process alive

var LogStream = require('LogStream');
var logger = LogStream.new();//('./log/admin.log');

logger.registerStyles({
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
if( !true ){
	var server = NodeProcess.new(process.cwd() + '/app/server/server.js');

	server.console = logger;
	server.setRestartFiles(
		"./app/node_modules",
		"./app/config/index.js",
		"./app/server/server.js",
		"./app/server/node_modules",
		"./app/server/lang/fr"
	);

	server.on('crash', function(){
		var http = require('http');
		var emergencyServer = http.createServer(function(request, response){
			response.writeHead(200, {'Content-Type': 'text/plain'});
			response.write('Server down');
			response.end();
		});

		emergencyServer.listen(config.port, config.host, function(){
			logger.warn('Emergency server listening {host}:{port}', config);

			server.restart = function(){
				emergencyServer.close(function(){
					logger.info('Emergency server closed');
					server.restart = NodeProcess.restart;
					server.restart();
				});
			};
		});
	});

	server.start();
}

// test process
if( true ){
	var test = NodeProcess.new(process.cwd() + '/node_modules/nodetest/run.js', '../../../nodesite');
	
	test.console = logger;
	test.setRestartFiles(
		"./node_modules/nodetest"
	);

	test.start();
}

// database process (maybe will be launched by server)