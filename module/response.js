
var exports = {
	Url: require('url'),

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

	parseUrl: function(url){
		try{
			return this.Url.parse(url);
		}
		catch(e){
			return null;
		}
	},

	start: function(){
		var request = this.request, url, pathname, slash, dirname, file;

		if( request.method == 'OPTIONS' ){
			return this.handle('options');
		}

		url = this.parseUrl(this.request.url);

		if( !url ) return this.handle('error');

		request.parsedUrl = url;

		if( 'x-requested-with' in request.headers && request.headers['x-requested-with'].toLowerCase() == 'xmlhttprequest' ){
			return this.handle('ajax');
		}

		pathname = url.pathname;
		// enlève le premier /
		pathname = pathname.substr(1);

		// page d'index demandée
		if( pathname === '' || pathname === '/app.html' ) return this.handle('page');

		slash = pathname.indexOf('/');
		// on demande quelque chose à la racine
		if( slash === -1 ){
			// sans extension ou finissant par pageExtension
			if( !pathname.contains('.') || pathname.endsWith('.js') || pathname.endsWith('.html') ){
				return this.handle('page');
			}
			return this.handle('file');
		}

		// traite tous les fichier HTML comme des pages
		if( pathname.endsWith('.html') ) return this.handle('page');

		// pour le pathname "css/admin/file.css" on regarde si "client/css" est un dossier
		dirname = pathname.substr(0, slash);
		file = NS.File.new(root + '/client/' + dirname);
		file.isDir(function(isdir){ return this.handle(isdir ? 'file' : 'page'); }.bind(this));
	}
};

module.exports = exports;
