exports.extend = {
	cookieSource: '',
	cookieParams: {},

	setCookie: function(properties){
		var cookies = this.headers['Set-Cookie'];

		if( typeof cookies == 'string' ){
			cookies = [cookies];
		}
		else if( !Array.isArray(cookies) ){
			cookies = [];
		}

		cookies.push(require('./cookie').stringify(properties));

		this.setHeader('Set-Cookie', cookies);
	},

	parseCookie: function(cookies){
		try{
			return require('../../cookie.js').parse(cookies);
		}
		catch(e){
			return e;
		}
	}
};

exports.use = function cookieParser(next){
	this.cookieSource = this.request.headers.cookie;
	if( this.cookieSource ){
		this.cookieParams = this.parseCookie(this.cookieSource);
		if( this.cookieParams == null ){
			next(new Error('invalid cookies format'));
		}
		else if( this.cookieParams instanceof Error ){
			next(this.cookieParams);
		}
	}
	next();
};
