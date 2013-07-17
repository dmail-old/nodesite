var exports = {

	create: function(demand){
		this.demand = demand;
		this.start(demand.url.pathname);
	},

	start: function(path){
		var
			file = NS.File.new(root + '/client/' + path),
			extension = file.getExtension(),
			acceptEncoding
		;

		if( extension.charAt(0) == '.' ) extension = extension.substr(1);

		this.demand.setHeader('content-type', config.getMimetype(file.path));

		if( extension == 'js' || extension == 'css' ){
			acceptEncoding = this.demand.request.headers['accept-encoding'];

			/* Note: this is not a conformant accept-encoding parser.
			See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
			*/
			if( acceptEncoding && acceptEncoding.match(/\bgzip\b/) ){
				// essaye de délivrer le fichier en version compréssé
				file.setPath(file.path + '.gz');
				this.demand.setHeader('content-encoding', 'gzip');
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
				this.demand.removeHeader('content-encoding');
				this.file.setPathPart('extension', '');
				this.file.exists(this.exists.bind(this));
				return;
			}
			return this.demand.writeEnd(404);
		}
		this.file.stat(this.stat.bind(this));
	},

	stat: function(error, stats){
		// erreur pendant la récupération de infos du fichier
		if( error ) return this.demand.error(error);
		// seul les fichiers sont autorisé
		if( !stats.isFile() ) return this.demand.writeEnd(403);

		var modified = true;
		try{
			var mtime = new Date(this.demand.request.headers['if-modified-since']);
			if( mtime >= stats.mtime ) modified = false;
		}
		catch(e){
			console.warn(e);
		}
		// dit au navigateur que le fichier n'a pas changé
		if( !modified ) return this.demand.writeEnd(304);

		this.demand.setHeader('last-modified', stats.mtime);
		this.demand.setHeader('content-length', stats.size);
		// évite que chrome mette en cache et réutilise sans redemander au serveur les fichier HTML qu'on lui envoit
		this.demand.setHeader('cache-control', 'no-cache');

		if( ['.gz', '.zip', '.mp3'].contains(this.file.getExtension()) ){
			this.stream();
		}
		else{
			this.serve();
		}
	},

	stream: function(){
		this.demand.writeHead(200);

		function ondata(data){
			var flushed = this.demand.write(data);
			// Stoppe la lecture du flux lorsque la réponse est saturé
			if( !flushed ) this.streaming.pause();
		}

		function ondrain(){
			this.streaming.resume();
		}

		function end(){
			this.demand.end();
		}

		this.streaming = this.file.readStream();
		this.streaming.on('data', ondata.bind(this));
		this.streaming.on('end', end.bind(this));
		// redémarre le streaming quand la réponse est de nouveau prète
		this.response.on('drain', ondrain.bind(this));
	},

	serve: function(){
		function read(error, data){
			if( error ) return this.demand.error(error);

			this.demand.writeEnd(200, data);
		}

		this.file.read(read.bind(this));
	}
};

module.exports = exports;
