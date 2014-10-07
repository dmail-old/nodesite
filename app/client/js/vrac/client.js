var Client = Object.prototype.create({
	constructor: function(socket){
		// console.log(socket.handshake.headers.cookie);
		// grace au cookie de session, s'il existe on restaureras le compte de l'user
		// sinon on attendras une demande de login ou signin

		var session = Cookie.parse(socket.handshake.headers.cookie, 'session');

		/*if( session ){
			Session.get(session, function(error, data){
				if( error ){
					// pas de session
					return;
				}
				if( data ){

				}
				User.get()
			});
		}
		*/

		this.socket = socket;
		this.name = 'Admin';

		this.emit('news', 'Voici les dernière news');
		this.on('demand', this.demand.bind(this));

		logger.info(String.setType(this.name, 'name'), 'connected to the server');
	},

	toString: function(){
		return this.name;
	},

	on: function(){
		this.socket.on.apply(this.socket, arguments);
		return this;
	},

	emit: function(){
		this.socket.emit.apply(this.socket, arguments);
		return this;
	},

	demand: function(action){
		var args = toArray(arguments, 1);

		if( action == 'join' || action == 'leave' ){
			this[action].apply(this, args);
			return;
		}

		logger.info(String.setType(this.name, 'name') + 'demand' + String.setType(action, 'function'));

		var file = new File(root + '/action/' + action + '.js');

		if( !file.existsSync() ){
			// je fais rien
			logger.warn(action + 'n\'est pas une action connue');
		}
		else{
			args = [this].concat(args);
			// j'éxécute le code de ce fichier
			var script = require(file.path);
			script.apply(null, args);
		}
	},

	join: function(room, callback){
		logger.info(String.setType(this.name, 'name'), 'ask to join', String.setType(room, 'function'));

		this.socket.join(room);

		// dit aux autres que celui-ci vient d'arriver
		this.socket.broadcast.to(room).emit(room+'/join');

		// dit au client qu'il a été accepté
		callback(true);
	},

	leave: function(room, callback){
		logger.info(String.setType(this.name, 'name'), 'ask to leave', String.setType(room, 'function'));

		this.socket.leave(room);

		// dit aux autres qu'il est parti
		this.socket.broadcast.to(room).emit('leave');

		// dit au client qu'il a bien été enlevé
		callback(true);
	},

	memberOf: function(group){
		var room = this.socket.manager.rooms[group];
		return room && room.contains(this.socket.id);
	}
});

// var server = http.createServer();
// server.listen(config.port, config.host);


