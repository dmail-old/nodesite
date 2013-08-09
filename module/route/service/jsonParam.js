function parseJSON(json){
	if( typeof json == 'string' ){
		// decode URI component on json URI encoded string
		json = require('querystring').unescape(json);

		try{
			json = JSON.parse(json);
		}
		catch(e){
			json = null;
		}
	}

	return json;
}

module.exports = function jsonParam(next){
	if( this.bodyParams.json ){
		this.bodyParams.json = parseJSON(this.bodyParams.json);
		this.params.json = this.bodyParams.json;
	}
	if( this.urlParams.json ){
		this.urlParams.json = parseJSON(this.urlParams.json);
		this.params.json = this.urlParams.json;
	}
	next();
};

