var exports = {
	create: function(demand, e){
		if( e ) logger.error(e);

		demand.response.writeHead(500, {'content-type': 'text/plain'});
		demand.response.write('Internal server error');
		demand.response.end();
	}
};

module.exports = exports;
