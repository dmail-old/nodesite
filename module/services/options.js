var exports = {
	create: function(demand){
		var methodAllowed = [], headerAllowed = [];

		// methods
		methodAllowed.push('GET');
		methodAllowed.push('POST');
		methodAllowed.push('PUT');
		methodAllowed.push('DELETE');
		methodAllowed.push('OPTIONS');
		// headers
		headerAllowed.push('X-Requested-With');
		headerAllowed.push('content-type');
		headerAllowed.push('accept');

		/*
		headerAllowed.push('content-disposition');
		headerAllowed.push('Content-Transfer-Encoding');
		headerAllowed.push('Content-Length');
		headerAllowed.push('accept-encoding');
		headerAllowed.push('authorization');
		headerAllowed.push('user-agent');
		headerAllowed.push('host');
		headerAllowed.push('connection');
		*/

		demand.writeHead(204, {
			"access-control-allow-origin": demand.request.headers.origin || '*',
			"access-control-allow-methods": methodAllowed.join(', '),
			"access-control-allow-headers": headerAllowed.join(', '),
			"access-control-max-age": 10, // Seconds
			"content-length": 0
		});

		demand.end();
	}
};

module.exports = exports;
