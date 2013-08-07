module.exports = {
	'text/plain': function(data, encoding){
		if( data instanceof Error ){
			if( data.statusCode ) this.status = data.statusCode;
			data = data.message;
		}
		else if( typeof data === 'object' ){
			data = JSON.stringify(data);
		}
		else{
			data = data.toString();
		}

		this.setHeader('content-length', Buffer.byteLength(data));

		return data;
	},

	'application/json': function(data, encoding){
		var json = {
			status: this.status,
			data: data
		};

		this.status = 200;

		if( data instanceof Error ){
			var type;

			// s'il s'agit d'une erreur de syntaxe on throw sinon la trace est pas
			// top (si une page contient une erreur de syntaxe ca fait donc planter le serveur)
			// possible lorsque qu'on fait callScript
			if( data instanceof SyntaxError ){
				type = 'syntax';
			}
			else if( data instanceof ReferenceError ){
				type = 'syntax';
			}
			else if( data instanceof TypeError ){
				type = 'type';
			}

			json.data = data.message;
			json.stack = data.stack;
			json.type = type;
		}
		else if( Buffer.isBuffer(data) ){
			data = data.toString(encoding || 'base64');
		}

		try{
			data = JSON.stringify(json);
		}
		catch(e){
			return this.error(e);
		}

		this.setHeader('content-length', Buffer.byteLength(data));

		return data;
	}
};
