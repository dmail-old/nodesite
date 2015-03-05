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

process.on('uncaughtException', function handleNativeError(error){
	require('fs').appendFileSync('./error.log', error.stack + '\n');
	console.log(error.stack);
	// no need to throw, but keep process alive and activate prompt for debug
	activatePrompt();
});
process.on('SIGHUP', function(){
	console.log('lost connection to console, the childprocess is over');
});

require('Object.assign');
var LogStream = require('LogStream');
var NodeProcess = require('NodeProcess');
var cwd = process.cwd();
var PATH = require('path');

var options = {
	path: PATH.resolve(cwd, process.argv[2]),
	prompt: true,
	args: []
};
var userOptions = {};

try{
	userOptions = require(options.path + '.config.js');

	if( userOptions.path ){
		userOptions.path = PATH.resolve(cwd, userOptions.path);
	}

	Object.assign(options, userOptions);
}
catch(e){
	// no config file
}

var childProcess = new NodeProcess(options.path, options.args);

if( options.restartFiles ){
	childProcess.setRestartFiles(options.restartFiles);
}
if( options.log ){
	childProcess.console = new LogStream();
}
if( options.events ){
	childProcess.on(options.events);
}

childProcess.start();