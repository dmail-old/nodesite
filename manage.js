/*
*/
function activatePrompt(){
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
}

function handleNativeError(error){
	require('fs').appendFileSync('./error.log', error.stack + '\n');
	console.log(error.stack);
	// no need to throw, but keep process alive and activate prompt for debug
	if( !childProcess || !childProcess.config.prompt ) activatePrompt();
}

process.on('uncaughtException', handleNativeError);
/*
process.on('SIGHUP', function(){
	console.log('lost connection to console, the childprocess is over');
	process.exit();
});
*/

var NodeProcess = require('NodeProcess');
var PATH = require('path');

var path = PATH.resolve(process.cwd(), process.argv[2]);
var childProcess = new NodeProcess(path);

childProcess.on('crash', activatePrompt);
childProcess.start();