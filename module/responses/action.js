var exports = {
	response: null,
	request: null,
	method: null,
	url: null,
	headers: null,
	params: null,
	action: null,

	create: function(request, response){
		this.response = response;
		this.request = request;
		this.method = this.request.method || 'GET';
		this.url = this.request.parsedUrl;
		this.action = this.url.pathname;
		this.headers = {};

		this.headers['content-type'] = 'application/json';

		/*
		on considère que je recoit toujours du JSON
		que ce soit en GET ou en POST
		*/

		this.getParameters(function(error, params){
			if( error ){
				return this.sendError(error);
			}

			this.params = params;
			this.start();

		}.bind(this));
	},

	getRequestEncoding: function(request){
		var contentType, charsetIndex, charset, search;

		search = 'charset=';
		contentType = request.headers['content-type'];
		charsetIndex = contentType.indexOf(search);

		if( charsetIndex === -1 ){
			charset = 'utf8';
		}
		else{
			charset = contentType.slice(charsetIndex + search.length);
			if( charset == 'utf-8' ) charset = 'utf8';
		}

		return charset;
	},

	parseQueryString: function(queryString, callback){
		var params = require('querystring').parse(queryString);

		if( params.format == 'json' ){
			if( params.json ){
				try{
					params = JSON.parse(params.json);
				}
				catch(e){
					return callback(e);
				}
			}
			else{
				params = null;
			}
		}

		return callback(null, params);
	},

	getParameters: function(callback){
		var queryString;

		if( this.method == 'GET' ){
			queryString = this.url.query;
			return this.parseQueryString(queryString, callback);
		}

		if( this.method == 'POST' ){
			queryString = '';
			this.request.setEncoding(this.getRequestEncoding(this.request));
			this.request.on('data', function(data){

				queryString+= data;

				if( queryString.length > 1e6 ){
					callback(new Error('Request Entity Too Large'));
					this.request.connection.destroy();
				}

			}.bind(this));
			this.request.on('end', function(){
				return this.parseQueryString(queryString, callback);
			}.bind(this));
		}
	},

	start: function(){
		var action = this.action;
		var params = this.params;

		if( !action.endsWith('.js') ) action+= '.js';

		if( typeof params == 'object' ){
			logger.info('ACTION ' + String.setType(action, 'path') + ' ' + String.setType(params, 'b'));
			return this.sendScriptResponse(root + '/' +  action, params);
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

		// s'il s'agit d'une erreur de syntaxe on throw sinon la trace est pas
		// top (si une page contient une erreur de syntaxe ca fait donc planter le serveur)
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

			if( error ) return this.sendError(error);

			this.send(response);

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
