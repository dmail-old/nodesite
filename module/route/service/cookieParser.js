require('../../../client/js/browser/cookie');

exports.extend = {
	cookieSource: '',
	cookieParams: {},
	cookieModule: NS.Cookie,

	setCookie: function(options){
		var cookies = this.headers['Set-Cookie'];

		if( typeof cookies == 'string' ){
			cookies = [cookies];
		}
		else if( !Array.isArray(cookies) ){
			cookies = [];
		}

		var cookie = this.cookieModule.new(options);

		cookies.push(cookie.toString());

		this.setHeader('Set-Cookie', cookies);
	},

	parseCookie: function(cookies){
		try{
			return this.cookieModule.parseAll(cookies);
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
