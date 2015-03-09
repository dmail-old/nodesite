module.exports = {
	"path": "./app/server/server.js",
	"args": {
		"host": "127.0.0.1",
		"port": 8124
	},
	"env": {
		"DEBUG": !true
	},
	"restartFiles": [
		"./app/node_modules",
		"./app/config/index.js",
		"./app/server/server.js",
		"./app/server/node_modules",
		"./app/server/lang/fr"
	],
	"log": !true,
	"prompt": true,
	"events": {
		"crash": function(){
			var serverProcess = this;
			var http = require('http');
			var emergencyServer = http.createServer(function(request, response){
				response.writeHead(200, {'Content-Type': 'text/plain'});
				response.write('Server down');
				response.end();
			});

			emergencyServer.listen(serverProcess.args.port, serverProcess.args.host, function(){
				serverProcess.console.warn('Emergency server listening {host}:{port}', serverProcess.args);

				serverProcess.restart = function(){
					emergencyServer.close(function(){
						serverProcess.console.info('Emergency server closed');
						serverProcess.restart = serverProcess.constructor.prototype.restart;
						serverProcess.restart();
					});
				};
			});
		}
	}
};