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
		this.params = this.request.params;
		this.headers = {};

		this.headers['content-type'] = 'application/json';

		this.start();
	},

	start: function(){
		var action = this.action;
		var params = this.params;
		var args;
		var path = root + '/' + action;

		if( !action.endsWith('.js') ) action+= '.js';
		if( params instanceof Array ){
			args = params;
		}
		else if( typeof params == 'object' ){
			args = [];
			try{
				var module = require(path);
				var names = Function.argumentNames(module);
				var i = 0, j = names.length, name;

				for(;i<j;i++){
					name = names[i];
					args.push(params[name]);
				}
			}
			catch(e){

			}
		}
		else{
			args = [];
		}

		logger.info('ACTION ' + String.setType(action, 'path') + ' ' + String.setType(args, 'b'));

		return this.sendScriptResponse(path, args);
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
