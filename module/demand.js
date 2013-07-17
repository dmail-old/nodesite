
var exports = {
	AJAX_HEADER_NAME: 'x-requested-with',
	AJAX_HEADER_VALUE: 'xmlhttprequest',

	METHODS: {
		OPTIONS: 'OPTIONS',
		GET: 'GET',
		POST: 'POST',
		PUT: 'PUT',
		DELETE: 'DELETE'
	},

	request: null,
	response: null,
	url: null,
	urlSource: '',
	bodySource: '',
	cookieSource: '',
	urlParams: null,
	bodyParams: null,
	cookieParams: null,
	params: null,
	method: null,

	headers: null,
	status: 404,

	create: function(request, response){
		this.request = request;
		this.response = response;
	},

	parseUrl: function(url){
		try{
			return require('url').parse(url);
		}
		catch(e){
			return null;
		}
	},

	parseQueryString: function(queryString){
		var result;

		try{
			result = require('querystring').parse(queryString);
		}
		catch(e){
			return null;
		}

		var json = result.json;
		if( typeof json == 'string' ){
			try{
				json = JSON.parse(json);
			}
			catch(e){
				json = null;
			}

			result.json = json;
		}

		var method = result._method;
		if( typeof method == 'string' ){
			this.method = method.toUpperCase();
		}

		return result;
	},

	parseCookies: function(cookies){
		try{
			return require('./cookie').parse(cookies);
		}
		catch(e){
			return null;
		}
	},

	getRequestEncoding: function(request){
		var contentType, charsetIndex, charset, search;

		search = 'charset=';
		contentType = request.headers['content-type'];

		if( contentType ){
			charsetIndex = contentType.indexOf(search);

			if( charsetIndex === -1 ){
				charset = 'utf8';
			}
			else{
				charset = contentType.slice(charsetIndex + search.length);
				if( charset == 'utf-8' ) charset = 'utf8';
			}
		}
		else{
			charset = 'utf8';
		}

		return charset;
	},

	getRequestBody: function(request, callback, bind){
		var body = '';

		request.setEncoding(this.getRequestEncoding(request));
		request.on('data', function(data){

			body+= data;

			if( body.length > 1e6 ){
				callback.call(bind, new Error('Request Entity Too Large'));
				request.connection.destroy();
			}

		});
		request.on('end', function(){
			callback.call(bind, null, body);
		});
	},

	getRequestHandler: function(request){
		var url, pathname, slash, dirname, file, method;

		method = request.method.toLowerCase();

		if( method == 'options' ){
			return 'options';
		}

		url = this.url;
		pathname = url.pathname;
		// enlève le premier /
		pathname = pathname.substr(1);
		slash = pathname.indexOf('/');
		dirname = pathname.substr(0, slash);

		if( dirname == 'action' ){
			return 'action';
		}

		if( method == 'get' ){
			// page d'index demandée
			if( pathname === '' || pathname === '/app.html' ) return 'page';
			// traite tous les fichier HTML comme des pages
			if( pathname.endsWith('.html') ) return 'page';
			// on demande quelque chose à la racine, sans extension ou finissant par .js
			if( slash === -1 && (!pathname.contains('.') || pathname.endsWith('.js')) ){
				return 'page';
			}

			return 'file';
		}

		return 'unimplemented';
	},

	writeHead: function(status, headers){
		if( !status ) status = this.status;
		if( !headers ) headers = this.headers;

		var codes = require('http').STATUS_CODES;
		if( !(status in codes) ) status = 500;
		var desc = codes[status];

		this.response.writeHead(status, desc, headers);

		var level = 'info';
		if( status == 404 ) level = 'warn';
		var method;
		if( this.isFromAjax() ) method = 'AJAX';
		else method = this.method;

		logger.log(level, String.setType(method, 'function') +' '+ status +' '+ String.setType(this.url.pathname, 'path'));
	},

	write: function(data, encoding){
		this.response.write(data, encoding);
	},

	end: function(data, encoding){
		this.response.end(data, encoding);
	},

	writeEnd: function(status, data){
		this.writeHead(status);
		if( data ) this.write(data);
		this.end();
	},

	error: function(error){
		logger.log('error', error);
		this.writeEnd(500);
	},

	handle: function(type){
		var service;

		try{
			service = require('./services/' + type);

			try{
				service.new(this);
			}
			catch(e){
				this.error(e);
			}
		}
		catch(e){
			this.writeEnd(501);
		}
	},

	checkRoute: function(){
		return this.handle(this.getRequestHandler(this.request));
	},

	check: function(){
		this.checkRoute();
	},

	start: function(){

		this.headers = {};
		this.method = this.request.method;
		this.cookieSource = this.request.headers.cookie;
		this.cookieParams = this.parseCookies(this.cookieSource);

		this.url = this.parseUrl(this.request.url);
		if( this.url == null ) return this.handle('error');

		this.urlSource = this.url.query;
		this.urlParams = this.parseQueryString(this.urlSource);
		if( this.urlParams == null ) return this.handle('error');

		this.params = Object.append({}, this.urlParams);

		if( this.method == this.METHODS.POST || this.method == this.METHODS.PUT ){

			this.getRequestBody(this.request, function(error, body){
				if( error ){
					return this.handle('error', error);
				}

				this.bodySource = body;
				this.bodyParams = this.parseQueryString(this.bodySource);
				Object.append(this.params, this.bodyParams);
				this.check();

			}, this);

		}
		else{
			this.check();
		}
	},

	isFromAjax: function(){
		return this.request.headers[this.AJAX_HEADER_NAME] == this.AJAX_HEADER_VALUE;
	},

	setHeader: function(name, value){
		this.headers[name] = value;
	},

	removeHeader: function(name){
		delete this.headers[name];
	},

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
};

module.exports = exports;
