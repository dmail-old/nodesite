module.exports = Object.prototype.extend({
	constructor: function(request, response){
		this.response = response;
		this.request = request;
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
			file = NS.File.new(root + '/client/' + path),
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
			var mtime = new Date(this.request.headers['if-modified-since']);
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

			if( this.file.getExtension() == '.js' ){
				var begin = '(function(){\r\rvar module = new Module("'+ this.file.getFilename() +'");\r\r';
				var end = '\r})();';

				this.headers['content-length']+= begin.length + end.length;
				data = begin + data + end;
			}

			this.writeHead(200, this.headers);
			this.write(data);
			this.end();
		}

		this.file.read(read.bind(this));
	}
});
