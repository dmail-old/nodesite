exports.extend = {
	args: null,

	getScriptPath: function(action){
		if( !action.endsWith('.js') ) action+= '.js';

		return root + '/' + action;
	},

	getRequestArguments: function(action){
		var args, params = this.params;

		if( Array.isArray(this.bodyParams) ){
			args = this.bodyParams;
		}
		else{
			// j'ai passé du json comme paramètre, cela prévaut sur queryString
			if( params.json ){
				params = params.json;
			}

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
					module = require(this.getScriptPath(action));
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
		}

		return args;
	},

	sendAction: function(action){
		this.args = this.getRequestArguments(action);
		return this.sendScriptResponse(this.getScriptPath(action), this.args);
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
				if( !handle.call(this, action, args) ){
					return this.error(new Error('unauthorized'));
				}
			}
		}

		global.applyScript(path, this, args, function(error, response){

			if( error ){
				this.error(error);
			}
			else{
				this.send(200, response);
			}

		}.bind(this));
	}
};
