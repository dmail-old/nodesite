module.exports = NS.Item.extend({
	Url: require('url'),

	constructor: function(request, response){
		this.request = request;
		this.response = response;
		this.start();
	},

	error: function(e){
		this.response.writeHead(500, 'Internal server error' + e);
		this.response.end();
	},

	handle: function(type){
		var name = type + 'response', responseModule;

		try{
			responseModule = require(root + '/module/' + type + 'Response');

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
		var
			request = this.request,
			url = this.parseUrl(this.request.url),
			pageExtension = 'js',
			pathname, slash, dirname, file
		;

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
			if( !pathname.contains('.') || pathname.endsWith('.' + pageExtension) || pathname.endsWith('.html') ){
				return this.handle('page');
			}
			return this.handle('file');
		}

		// pour le pathname "css/admin/file.css" on regarde si "client/css" est un dossier
		dirname = pathname.substr(0, slash);
		file = NS.File.new(root + '/client/' + dirname);
		file.isDir(function(isdir){ return this.handle(isdir ? 'file' : 'page'); }.bind(this));
	}
});
