exports.extend = {
	urlParams: {},
	parseQueryString: function(queryString){
		var result;

		try{
			result = require('querystring').parse(queryString);
		}
		catch(e){
			return null;
		}

		return result;
	}
};

exports.use = function queryParser(next){
	this.urlParams = this.parseQueryString(this.url.query);
	if( this.urlParams == null ) return next(new Error('invalid query params'));
	next();
};
