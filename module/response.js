
var exports = {
	create: function(request, response){
		this.request = request;
		this.response = response;
	},

	error: function(e){
		this.response.writeHead(500, 'Internal server error' + e);
		this.response.end();
	},

	handle: function(type){
		var responseModule;

		try{
			responseModule = require('./responses/' + type);

			try{
				responseModule.new(this.request, this.response);
			}
			catch(e){
				this.error(e);
			}
		}
		catch(e){
			this.response.writeHead(501, 'Not implemented' + type);
			this.response.end();
		}
	},

	checkRoute: function(){
		/*
		au lieu de ça
		faudrais faire quelque chose de plus visuel comme:

		this.get('*.html', function(){
			return this.handle('page');
		});

		this.when('options', '*', function(){
			return this.handle('options');
		});

		this.get('action/filesystem/*', function(file){
			if( file ){
				this.url.pathname+= 'read';
				this.url.query = '?path=' + file;
			}
			else{
				this.url.pathname+= 'list';
			}

			this.handle('action');
		});

		this.post('action/filesystem', function(){
			this.url.pathname+= 'write';
			this.handle('action');
		});

		*/

		var request = this.request, response = this.response;
		var url, pathname, slash, dirname, file;

		if( request.method == 'OPTIONS' ){
			return this.handle('options');
		}

		url = request.parsedUrl;
		pathname = url.pathname;
		// enlève le premier /
		pathname = pathname.substr(1);

		// page d'index demandée
		if( pathname === '' || pathname === '/app.html' ) return this.handle('page');

		// traite tous les fichier HTML comme des pages
		if( pathname.endsWith('.html') ) return this.handle('page');

		slash = pathname.indexOf('/');
		// on demande quelque chose à la racine
		if( slash === -1 ){
			// sans extension ou finissant par pageExtension
			if( !pathname.contains('.') || pathname.endsWith('.js') || pathname.endsWith('.html') ){
				return this.handle('page');
			}
			return this.handle('file');
		}

		dirname = pathname.substr(0, slash);

		if( dirname == 'action' ){
			return this.handle('action');
		}

		// pour le pathname "css/admin/file.css" on regarde si "client/css" est un dossier
		file = NS.File.new(root + '/client/' + dirname);
		file.isDir(function(isdir){ return this.handle(isdir ? 'file' : 'page'); }.bind(this));
	},

	check: function(params){
		var request = this.request, response = this.response;

		if( params.json ){
			var json;

			try{
				json = JSON.parse(params.json);
			}
			catch(e){
				json = null;
			}

			if( json instanceof Array ) params = json;
			else if( typeof json == 'object' ) Object.append(params, params.json);
		}

		if( params._method ){
			request.method = params._method.toUpperCase();
		}

		if( 'x-requested-with' in request.headers && request.headers['x-requested-with'].toLowerCase() == 'xmlhttprequest' ){
			request.AJAX = true;
		}

		request.params = params;

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
		try{
			return require('querystring').parse(queryString);
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


	start: function(){
		var request = this.request, response = this.response;
		var method, url, query, params, bodyQueryString;

		url = this.parseUrl(request.url);

		if( !url ) return this.handle('error');

		request.parsedUrl = url;
		method = request.method.toLowerCase();
		query = url.query;
		params = this.parseQueryString(query);

		if( !params ) return this.handle('error');

		if( method == 'post' || method == 'put' ){
			bodyQueryString = '';
			request.setEncoding(this.getRequestEncoding(request));
			request.on('data', function(data){

				bodyQueryString+= data;

				if( bodyQueryString.length > 1e6 ){
					this.handle('error', new Error('Request Entity Too Large'));
					request.connection.destroy();
				}

			}.bind(this));
			request.on('end', function(){

				Object.append(params, this.parseQueryString(bodyQueryString));
				this.check(params);

			}.bind(this));
		}
		else{
			this.check(params);
		}
	}
};

module.exports = exports;
