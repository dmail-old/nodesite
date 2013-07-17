
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
	urlParamsSource: '',
	bodyParamsSource: '',
	urlParams: null,
	bodyParams: null,
	params: null,
	method: null,
	headers: null,
	status: 404,

	create: function(request, response){
		this.request = request;
		this.response = response;
		this.headers = {};
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

	setHeader: function(name, value){
		this.headers[name] = value;
	},

	removeHeader: function(name){
		delete this.headers[name];
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

	checkRoute: function(){
		return this.handle(this.getRequestHandler(this.request));
	},


	isFromAjax: function(){
		return this.request.headers[this.AJAX_HEADER_NAME] == this.AJAX_HEADER_VALUE;
	},

	check: function(){
		this.checkRoute();
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

	start: function(){
		var request = this.request, response = this.response;
		var method, url, query, queryString, bodyQueryString;

		url = this.parseUrl(request.url);

		if( !url ) return this.handle('error');

		this.url = url;
		this.method = request.method;
		this.urlParamsSource = url.query;
		this.urlParams = this.parseQueryString(this.urlParamsSource);

		if( !this.urlParams ) return this.handle('error');

		this.params = Object.append({}, this.urlParams);

		if( this.method == this.METHODS.POST || this.method == this.METHODS.PUT ){
			this.bodyParamsSource = '';
			request.setEncoding(this.getRequestEncoding(request));
			request.on('data', function(data){

				this.bodyParamsSource+= data;

				if( this.bodyParamsSource.length > 1e6 ){
					this.handle('error', new Error('Request Entity Too Large'));
					request.connection.destroy();
				}

			}.bind(this));
			request.on('end', function(){

				this.bodyParams = this.parseQueryString(this.bodyParamsSource);
				Object.append(this.params, this.bodyParams);

				this.check();

			}.bind(this));
		}
		else{
			this.check();
		}
	}
};

module.exports = exports;
