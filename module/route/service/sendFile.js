exports.extend = {
	file: null,
	useStream: true,

	isModified: function(mtime){
		var date, modified = this.request.headers['if-modified-since'];

		if( typeof modified == 'string' ){
			try{
				date = new Date(modified);
			}
			catch(e){
				return true;
			}

			return mtime > date;
		}
		else{
			return true;
		}
	},

	streamFile: function(){
		this.writeHead(200);

		function ondata(data){
			var flushed = this.write(data);
			// Stoppe la lecture du flux lorsque la réponse est saturé
			if( !flushed ) this.streaming.pause();
		}

		function ondrain(){
			this.streaming.resume();
		}

		function end(){
			this.end();
		}

		this.streaming = this.file.readStream();
		this.streaming.on('data', ondata.bind(this));
		this.streaming.on('end', end.bind(this));
		// redémarre le streaming quand la réponse est de nouveau prète
		this.response.on('drain', ondrain.bind(this));
	},

	onread: function(error, data){
		if( error ) return this.error(error);
		this.send(200, data);
	},

	readFile: function(){
		this.file.read(this.onread.bind(this));
	},

	fileStat: function(error, stats){
		// erreur pendant la récupération de infos du fichier
		if( error ) return this.error(error);
		// seul les fichiers sont autorisé
		if( !stats.isFile() ) return this.send(403);

		if( this.isModified(stats.mtime) ){
			this.setHeader('last-modified', stats.mtime);
			this.setHeader('content-length', stats.size);
			// évite que chrome mette en cache et réutilise sans redemander au serveur les fichier HTML qu'on lui envoit
			this.setHeader('cache-control', 'no-cache');

			if( this.method == this.METHODS.HEAD ){
				this.send(200);
			}
			else{
				if( this.useStream ){
					this.streamFile();
				}
				else{
					this.readFile();
				}
			}
		}
		// dit au navigateur que le fichier n'a pas changé
		else{
			return this.send(304);
		}
	},

	acceptEncoding: function(){
		var acceptEncoding = this.request.headers['accept-encoding'];

		/* Note: this is not a conformant accept-encoding parser.
		See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
		*/
		return acceptEncoding && acceptEncoding.match(/\bgzip\b/);
	},

	fileExists: function(result){
		if( result === false ){
			// si la version gz existe pas, tente de délivrer la version normale
			if( this.gz ){
				delete this.gz;
				this.removeHeader('content-encoding');
				this.file.setPathPart('extension', '');
				this.file.exists(this.fileExists.bind(this));
				return;
			}
			return this.send(404);
		}

		this.file.stat(this.fileStat.bind(this));
	},

	sendFile: function(path, useStream){
		if( typeof useStream == 'boolean' ){
			this.useStream = useStream;
		}

		var file = NS.File.new(root + '/client/' + path), extension = file.getExtension();

		if( extension.charAt(0) == '.' ) extension = extension.substr(1);

		this.setContentType(config.getMimetype(file.path));

		if( (extension == 'js' || extension == 'css') && this.acceptEncoding() ){
			// essaye de délivrer le fichier en version compréssé
			file.setPath(file.path + '.gz');
			this.setHeader('content-encoding', 'gzip');
			this.gz = true;
		}

		this.file = file;
		this.file.exists(this.fileExists.bind(this));
	}
};
