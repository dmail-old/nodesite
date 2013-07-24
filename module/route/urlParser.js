exports.extend = {
	url: null,

	parseUrl: function(url){
		try{
			return require('url').parse(url);
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
