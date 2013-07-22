var exports = {
	demand: null,
	action: null,

	create: function(demand){
		this.demand = demand;
		this.action = demand.url.pathname;
		this.start();
	},

	send: function(data){
		this.demand.send(200, data);
	},

	error: function(error){
		this.demand.error(error);
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
