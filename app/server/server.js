var server = require('server');
var args = require('argv').parse(process.argv);
// https://nodejs.org/api/repl.html
var repl = require('repl');

repl.start({
	prompt: '> ',
}).on('exit', function(){
	process.exit(0);
});

Object.define(server.config, args);

server.open();
server.listen(server.config.port, server.config.host, function(error){
	if( error ){
		if( error.code == 'EADDRINUSE' ){
			error.message = 'Port ' + config.port + ' already in use';
		}
		throw error;
	}

	server.logger.info('Server listening {host}:{port}', {
		host: config.host,
		port: config.port
	});
});

// http://joseoncode.com/2015/01/18/reloading-node-with-no-downtime/?utm_source=nodeweekly&utm_medium=email
// http://nodejs.org/api/cluster.html#cluster_cluster
// http://joseoncode.com/2014/07/21/graceful-shutdown-in-node-dot-js/
// https://github.com/isaacs/server-destroy
process.on('SIGTERM', function(){
	server.close(function(){
		process.exit(0);
	});
});