module.exports = function methodOverride(next){
	if( '_method' in this.urlParams ){
		this.method = this.urlParams._method.toUpperCase();
	}
	else if( '_method' in this.bodyParams ){
		this.method = this.bodyParams._method.toUpperCase();
	}
	else if( 'x-http-method-override' in this.request.headers ){
		this.method = this.request.headers['x-http-method-override'].toUpperCase();
	}

	next();
};
