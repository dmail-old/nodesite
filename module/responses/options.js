var exports = {
	create: function(request, response){
		response.writeHead(204, "No Content", {
			"access-control-allow-origin": request.headers.origin || "*",
			"access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
			"access-control-allow-headers": "X-Requested-With, content-type, accept",
			"access-control-max-age": 10, // Seconds.
			"content-length": 0
		});

		response.end();
	}
};

module.exports = exports;
