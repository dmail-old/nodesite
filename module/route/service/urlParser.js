exports.extend = {
	url: null,

	parseUrl: function(url){
		try{
			url = require('url').parse(url);
			url.pathname = require('querystring').unescape(url.pathname);
			return url;
		}
		catch(e){
			return null;
		}
	}
};

exports.use = function(next){
	this.url = this.parseUrl(this.request.url);
	// bad request
	if( this.url == null ) return this.send(400);
	next();
};
