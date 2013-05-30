var FileResponse = new Class({
	constructor: function(response){
		this.response = response;
		this.request = response.request;
		this.method = this.request.method || 'GET';
		this.url = this.request.parsedUrl;
		this.status = 404;
		this.headers = {};

		this.start(this.url.pathname);
	},

	writeHead: function(status, headers){
		if( status != 200 ){
			var codes = require('http').STATUS_CODES;
			if( !(status in codes) ) status = 500;
			var desc = codes[status];
			this.response.writeHead(status, desc, headers);
		}
		else{
			this.response.writeHead(status, headers);
		}

		var level = 'info';
		if( status == 404 ) level = 'warn';
		if( 'x-requested-with' in this.request.headers && this.request.headers['x-requested-with'].toLowerCase() == 'xmlhttprequest' ){
			this.method = 'AJAX';
		}
		logger.log(level, String.setType(this.method, 'function') +' '+ status +' '+ String.setType(this.file.path, 'path'));
	},

	write: function(data){
		this.response.write(data);
	},

	writeEnd: function(status){
		this.writeHead(status || this.status);
		this.end();
	},

	end: function(){
		this.response.end();
	},

	start: function(path){
		var
			file = new File(root + '/client/' + path),
			extension = file.getExtension(),
			acceptEncoding
		;

		if( extension.charAt(0) == '.' ) extension = extension.substr(1);

		this.headers['content-type'] = config.getMimetype(file.path);

		if( extension == 'js' || extension == 'css' ){
			acceptEncoding = this.request.headers['accept-encoding'];

			/* Note: this is not a conformant accept-encoding parser.
			See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
			*/
			if( acceptEncoding && acceptEncoding.match(/\bgzip\b/) ){
				// essaye de délivrer le fichier en version compréssé
				file.setPath(file.path + '.gz');
				this.headers['content-encoding'] = 'gzip';
				this.gz = true;
			}
		}

		this.file = file;
		this.file.exists(this.exists.bind(this));
	},

	exists: function(exist){
		if( !exist ){
			// si la version gz existe pas, tente de délivrer la version normale
			if( this.gz ){
				delete this.gz;
				delete this.headers['content-encoding'];
				this.file.setPathPart('extension', '');
				this.file.exists(this.exists.bind(this));
				return;
			}
			return this.writeEnd(404);
		}
		this.file.stat(this.stat.bind(this));
	},

	stat: function(error, stats){
		// erreur pendant la récupération de infos du fichier
		if( error ) return this.writeEnd(500);
		// seul les fichiers sont autorisé
		if( !stats.isFile() ) return this.writeEnd(403);

		var modified = true;
		try{
			var mtime = new Date(this.response.request.headers['if-modified-since']);
			if( mtime >= stats.mtime ) modified = false;
		}
		catch(e){
			console.warn(e);
		}
		// dit au navigateur que le fichier n'a pas changé
		if( !modified ) return this.writeEnd(304);

		this.headers['last-modified'] = stats.mtime;
		this.headers['content-length'] = stats.size;
		// évite que chrome mette en cache et réutilise sans redemander au serveur les fichier HTML qu'on lui envoit
		this.headers['cache-control'] = 'no-cache';

		if( ['.gz', '.zip', '.mp3'].contains(this.file.getExtension()) ){
			this.stream();
		}
		else{
			this.serve();
		}
	},

	stream: function(){
		this.writeHead(200, this.headers);

		function ondata(data){
			var flushed = this.write(data);
			// Stoppe la lecture du flux lorsque la réponse est saturé
			if( !flushed ) this.streaming.pause();
		}

		function ondrain(){
			this.streaming.resume();
		}

		var end = this.end;

		this.streaming = this.file.readStream();
		this.streaming.on('data', ondata.bind(this));
		this.streaming.on('end', end.bind(this));
		// redémarre le streaming quand la réponse est de nouveau prète
		this.response.on('drain', ondrain.bind(this));
	},

	serve: function(){
		function read(error, data){
			if( error ) return this.writeEnd(500);

			this.writeHead(200, this.headers);
			this.write(data);
			this.end();
		}

		this.file.read(read.bind(this));
	}
});

var Cookie = require(root + '/require/cookie.js');

var Page = {
	// metas utilisant l'attribut "http-equiv"
	http_equiv: ['content-language','content-type','refresh','pragma','expires','cache-control','cache'],
	metaTemplate: '<meta {attr}="{name}" content="{value}" />',

	parseMeta: function(name, value){
		name = name.toLowerCase();
		var attr = 'name', meta;

		if( this.http_equiv.contains(name) ){
			attr = 'http-equiv';
			name = name.capitalize();
		}

		if( name == 'charset' ){
			return '<meta charset="' + value + '" />';
		}

		return this.metaTemplate.parse({
			attr: attr,
			name: name,
			value: value
		});
	},

	parseMetas: function(metas){
		var output = [], name;

		for(name in metas){
			output.push(this.parseMeta(name, metas[name]));
		}

		return output.join('\n\t');
	},

	setTagUrl: function(tag, path){
		var url = Url.format({
			protocol: config.protocol,
			host: config.host + (config.port ? ':' + config.port : ''),
			pathname: path
		});

		return tag.replace('#', url);
	}
};

function PageResponse(response){
	function serveError(e){
		logger.error(e);

		response.writeHead(500, {'content-type': 'text/plain'});
		response.write('500 Internal error');
		response.end();
	}

	var htmlFile = new File(root + '/app.html'), html;

	try{
		html = String(htmlFile.readSync());
	}catch(e){
		return serveError(e);
	}

	var metas = {
		'charset': config.encoding,
		'content-type': 'text/html',
		'content-language': config.lang,
		'description': lang.metas.description,
		'keywords': lang.metas.keywords,
		'robots': config.robot || 'all'
		// viewport: 'width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=1;' // pour les portables
	};

	// si on est en local ceci évite la mise en cache qui est pénible
	if( config.local ){
		metas['cache-control'] = metas['pragma'] = 'no-cache';
		// metas['cache'] = 'no store';
		metas['expires'] = 0;
	}

	var data = {
		'metas': Page.parseMetas(metas),
		'title': lang.metas.title,
		'favicon': Page.setTagUrl('<link href="#" type="image/x-icon" rel="shortcut icon"/>', 'favicon.png'),
		'lang': JSON.stringify(lang, Function.replacer),
		'config': JSON.stringify({
			'js': config.js,
			'css': config.css,
			'protocol': config.protocol,
			'host': config.host,
			'port': config.port
		})
	};

	logger.info('Send app.html');
	response.writeHead(200, {'content-type': 'text/html'});
	response.write(html.parse(data));
	response.end();
}

var AjaxResponse = new Class({
	constructor: function(response){
		this.response = response;
		this.request = response.request;
		this.method = this.request.method || 'GET';
		this.url = this.request.parsedUrl;
		this.headers = {};

		/*
		on considéère que je recoit toujours du JSON
		que ce soit en GET ou en POST
		*/

		if( this.method == 'GET' ){
			var contentType = this.request.headers['content-type'];
			var query = this.url.query;

			query = require('querystring').parse(query);

			try{
				this.data = JSON.parse(query.json);
			}
			catch(e){
				return this.error(e);
			}

			this.start(this.data);
		}
		else if( this.method == 'POST' ){
			var post = '';

			this.request.setEncoding('utf8');
			this.request.on('data', function(postData){
				post+= postData;
				logger.info('Paquet POST reçu "'+ postData + '"');
				if( post.length > 1e6 ){
					post = "";
					this.sendError(new Error("Request Entity Too Large"));
					this.request.connection.destroy();
				}
			}.bind(this));
			this.request.on('end', function(){
				// var contentType = this.request.headers['content-type'];
				// if( contentType && contentType.startsWith('application/x-www-form-urlencoded') )

				post = require('querystring').parse(post);

				try{
					this.data = JSON.parse(post.json);
				}
				catch(e){
					return this.error(e);
				}

				this.start(this.data);
			}.bind(this));
		}
	},

	start: function(data){
		if( Array.isArray(data) ){
			data = {
				action: data[0],
				args: data.slice(1)
			};
		}

		if( typeof data == 'object' ){
			if( data.action ){
				logger.info('AJAX ' + String.setType(data.action, 'path') + ' ' + String.setType(data.args, 'b'));
				return this.sendScriptResponse(root + '/action/' + data.action + '.js', data.args);
			}
		}

		this.error(new Error('server unable to understand the request'));
	},

	send: function(message){
		// quand on appel send avec message == null ou undefined, on répond juste au client que tout s'est bien passé
		if( message == null ) message = {ok: true};

		this.write(message);
		this.end();
	},

	sendError: function(error){
		logger.warn(error);

		var message = {
			error: true,
			message: error.message,
			stack: error.stack
		};

		// s'il s'agit d'une erreur de syntaxe on throw sinon la trace est pas top (si une page contient une erreur de syntaxe ca fait donc planter le serveur)
		// possible lorsque qu'on fait callScript
		if( error instanceof SyntaxError ){
			message.type = 'syntax';
		}
		else if( error instanceof ReferenceError ){
			message.type = 'reference';
		}
		else if( error instanceof TypeError ){
			message.type = 'type';
		}

		this.send(message);
	},

	sendScriptResponse: function(path, args){
		var Path = require('path');
		// quel est le chemin relatif à la racine?
		var relative = Path.relative(root, path);
		var directories = relative.split(/\\|\//);

		// si on demande une action
		if( directories[0] == 'action' ){
			var group = directories.length > 2 ? directories[directories.length - 2] : './';
			var action = Path.basename(relative, '.js');
			var handle = config.actions[group];

			// appelle les handlers pour une type d'action (./, filesystem, etc)
			if( typeof handle == 'function' ){
				if( !handle.call(this, action, args) ) return this.sendError(new Error('unauthorized'));
			}
		}

		global.applyScript(path, this, args, function(error, response){
			if( error ) this.sendError(error);
			else this.send(response);
		}.bind(this));
	},

	sendFile: function(filepath){
		console.log('senfile', filepath);
		this.response.request.parsedUrl.pathname = filepath;
		return new FileResponse(this.response);
	},

	error: function(e){
		logger.error(e);
		this.sendError(e);
	},

	write: function(data){
		if( data == null ) return this.error(new TypeError('sending null data to client'));

		this.response.writeHead(200, {'content-type': 'application/json'});

		switch(typeof data){
		case 'object':
			try{
				data = JSON.stringify(data);
			}
			catch(e){
				return this.error(e);
			}
			break;
		case 'string':
			// lorsqu'on passe une chaine on suppose alors qu'on envoit un texte brut
			data = JSON.stringify(data);
			// {
				// message: data
			// });
			break;
		}

		this.response.write(data);

	},

	end: function(){
		this.response.end();
	}
});

var Handlers = {
	'error': function(response){
		response.writeHead(500, 'Internal server error');
		response.end();
	},
	'file': FileResponse,
	'page': PageResponse,
	'ajax': AjaxResponse
};

var Url = require('url');

function parseUrl(url){
	try{
		return Url.parse(url);
	}
	catch(e){
		return null;
	}
}

function findHandler(request, callback){
	var
		url = parseUrl(request.url),
		pageExtension = 'js',
		pathname, slash, dirname, file
	;

	if( !url ) return callback('error');

	request.parsedUrl = url;

	if( 'x-requested-with' in request.headers && request.headers['x-requested-with'].toLowerCase() == 'xmlhttprequest' ){
		return callback('ajax');
	}

	pathname = url.pathname;
	// enlève le premier /
	pathname = pathname.substr(1);

	// page d'index demandée
	if( pathname === '' ) return callback('page');

	slash = pathname.indexOf('/');
	// on demande quelque chose à la racine
	if( slash === -1 ){
		// sans extension ou finissant par pageExtension
		if( !pathname.contains('.') || pathname.endsWith('.'+pageExtension) || pathname.endsWith('.html') ) return callback('page');
		return callback('file');
	}

	// pour le pathname "css/admin/file.css" on regarde si "client/css" est un dossier
	dirname = pathname.substr(0, slash);
	file = new File(root + '/client/' + dirname);
	file.isDir(function(isdir){ return callback(isdir ? 'file' : 'page'); });
}

function handle(request, response){
	function onfind(handlerName){
		response.request = request;

		var handler = Handlers[handlerName];

		if( !handler ){
			response.writeHead(501, 'Not implemented');
			response.end();
			return;
		}

		new handler(response);
	}

	findHandler(request, onfind);
}

module.exports = handle;
