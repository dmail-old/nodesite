var EventEmitter = require('events').EventEmitter;

var manager = {
	send: function(message){
		process.send(message);
	},

	onmessage: function(message, handle){
		if( typeof message == 'string' ){
			return this.emit('message', message);
		}

		switch(message.type){
			case 'event':
				this.emit.apply(this, [message.event].concat(message.args));
			break;
			case 'action':
				var action = message.action, args = message.args;

				args.push(this.sendResult.bind(this, action));

				if( !this.listeners(action) ){
					throw new Error('aucune action définie pour ' + action);
				}
				else{
					this.emit.apply(this, [action].concat(args));
				}
			break;
			case 'result':
				this.emit.apply(this, [message.action].concat(message.args));
			break;
			case 'error':
				this.emit.call(this, 'error', message.error);
			break;
		}
	},

	demand: function(action, callback){
		var running = Boolean(this.listeners(action).length);

		this.once(action, callback);
		if( !running ){
			this.send({
				type: 'action',
				action: action,
				args: []
			});
		}
	},

	sendEvent: function(event){
		this.send({type: 'event', event: event, args: Array.slice(arguments, 1)});
	},

	sendResult: function(action){
		var args = Array.slice(arguments, 1), first = args[0];

		if( first instanceof Error ){
			var item = new Error, key;
			for(key in first) item[key] = first[key];

			Error.prepareStackTrace = function(err, stack){ return stack; };
			Error.captureStackTrace(item, this.sendResult);

			item.trace = item.stack.map(function(frame){
				return {file: frame.getFileName(), line: frame.getLineNumber(), column: frame.getColumnNumber(), fn: frame.getFunctionName()};
			});

			this.send({type: 'result', action: action, error: item});
		}
		else{
			this.send({type: 'result', action: action, args: args});
		}
	},

	sendError: function(error){
		this.send({type: 'error', error: error});
	},

	parseArguments: function(args){
		if( args[0] instanceof Error ){
			console.debug(Error);
			console.color(Error);
			console.colorAll(Error);
		}
	}
};

Object.append(manager, new EventEmitter);
process.on('message', manager.onmessage.bind(manager));


module.exports = manager;
