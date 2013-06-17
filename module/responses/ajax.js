var exports = {
	constructor: function(request, response){
		this.response = response;
		this.request = request;
		this.method = this.request.method || 'GET';
		this.url = this.request.parsedUrl;
		this.headers = {};

		this.headers["access-control-allow-origin"] = this.request.headers.origin || "*";
		this.headers["content-type"] = 'application/json';

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

	error: function(e){
		logger.error(e);
		this.sendError(e);
	},

	write: function(data){
		if( data == null ) return this.error(new TypeError('sending null data to client'));

		this.response.writeHead(200, this.headers);

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
};

module.exports = exports;
