var exports = {
	demand: null,
	action: null,
	json: null,
	headers: null,

	create: function(demand){
		this.demand = demand;
		this.action = demand.url.pathname;
		this.headers = {};
		this.start();
	},

	setHeader: function(name, value){
		this.headers[name] = value;
	},

	writeEnd: function(status, data){
		this.demand.writeHead(200, {
			'content-type': 'application/json'
		});

		var json = {
			status: status,
			headers: this.headers,
			data: data,
		};

		var body;

		try{
			body = JSON.stringify(json);
		}
		catch(e){
			return this.error(e);
		}

		this.demand.write(body);
		this.demand.end();
	},

	error: function(error){
		var type;

		// s'il s'agit d'une erreur de syntaxe on throw sinon la trace est pas
		// top (si une page contient une erreur de syntaxe ca fait donc planter le serveur)
		// possible lorsque qu'on fait callScript
		if( error instanceof SyntaxError ){
			type = 'syntax';
		}
		else if( error instanceof ReferenceError ){
			type = 'syntax';
		}
		else if( error instanceof TypeError ){
			type = 'type';
		}

		this.writeEnd(500, {
			message: error.message,
			stack: error.stack,
			type: type
		});
	},

	send: function(data){
		this.writeEnd(200, data);
	},

	start: function(){
		var action = this.action;
		var actionFile = action;
		var params = this.demand.params;
		var args;
		var path;

		if( !actionFile.endsWith('.js') ) actionFile+= '.js';
		path = root + '/' + actionFile;
		// j'ai passé du json comme paramètre, cela prévaut sur queryString
		if( params.json ) params = params.json;

		if( params == null ){
			args = [];
		}
		else if( Array.isArray(params) ){
			args = params;
		}
		else if( typeof params == 'object' ){
			args = [];
			var module;
			try{
				module = require(path);
			}
			catch(e){
				module = null;
				args = [];
			}
			finally{
				var names = Function.argumentNames(module);
				var i = 0, j = names.length - 1, name;

				for(;i<j;i++){
					name = names[i];
					args.push(params[name]);
				}
			}
		}
		else{
			args = [];
		}

		logger.info('ACTION ' + String.setType(action, 'path') + ' ' + String.setType(args, 'b'));

		return this.sendScriptResponse(path, args);
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
				if( !handle.call(this, action, args) ) return this.error(new Error('unauthorized'));
			}
		}

		global.applyScript(path, this, args, function(error, response){

			if( error ) return this.error(error);

			this.send(response);

		}.bind(this));
	}
};

module.exports = exports;
