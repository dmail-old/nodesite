// route the couple request/response to handlers

var route = {
	AJAX_HEADER_NAME: 'x-requested-with',
	AJAX_HEADER_VALUE: 'xmlhttprequest',

	METHODS: {
		OPTIONS: 'OPTIONS',
		HEAD: 'HEAD',
		GET: 'GET',
		POST: 'POST',
		PUT: 'PUT',
		DELETE: 'DELETE'
	},

	request: null,
	response: null,
	method: null,
	status: null,
	headers: null,
	data: null,
	handlers: [],

	create: function(request, response){
		this.request = request;
		this.response = response;
		this.headers = {};
		this.method = this.request.method;
		this.emitter = NS.Emitter.new(this);
	},

	use: function(handler){
		this.handlers.push(handler);
	},

	isMethod: function(method){
		if( method == 'all' || method == '*' ) return true;
		return this.method.toLowerCase() === method;
	},

	isFromAjax: function(){
		return this.request.headers[this.AJAX_HEADER_NAME] == this.AJAX_HEADER_VALUE;
	},

	setHeader: function(name, value){
		this.headers[name] = value;
	},

	hasHeader: function(name){
		return name in this.headers;
	},

	getHeader: function(name){
		return this.headers[name];
	},

	removeHeader: function(name){
		delete this.headers[name];
	},

	setContentType: function(contentType, charset){
		if( contentType.startsWith('text') ){
			// this kind of header must be set for all textfile containing utf8 character?
			charset = charset || config.encoding;
			if( charset ) contentType+= ';charset=' + charset;
		}

		this.setHeader('content-type', contentType);
	},

	parseContentType: function(contentType){
		if( contentType ){
			var index = contentType.indexOf(';');
			if( index !== -1 ){
				contentType = contentType.slice(0, index);
			}
		}

		return contentType;
	},

	getContentType: function(){
		return this.parseContentType(this.getHeader('content-type'));
	},

	accept: function(contentType){
		return require('./accept.js').parse(this.request.headers.accept, [contentType]).length > 0;
	},

	prefferedContentType: function(){
		var accepts = require('./accept.js').parse(this.request.headers.accept);
		var i = 0, j = accepts.length, accept;

		for(;i<j;i++){
			accept = accepts[i];
			if( accept in this.formats ){
				return accept;
			}
		}

		return 'text';
	},

	writeHead: function(status, headers){
		if( status ) this.status = status;
		if( headers ) this.headers = headers;

		this.emitter.emit('header');

		var codes = require('http').STATUS_CODES;
		if( !(this.status in codes) ) this.status = 500;
		var desc = codes[this.status];

		if( this.hasHeader('content-type') ){
			var contentType = this.parseContentType(this.getHeader('content-type'));
			if( !this.accept(contentType) ){
				logger.warn(contentType + ' not in accept header');
			}
		}

		this.response.writeHead(this.status, desc, this.headers);
	},

	write: function(data, encoding){
		this.response.write(data, encoding);
	},

	end: function(data, encoding){
		this.response.end(data, encoding);
	},

	format: function(data, encoding){
		var contentType;

		if( 'content-type' in this.headers ){
			contentType = this.getContentType();
		}
		else{
			contentType = this.prefferedContentType();
			this.setContentType(contentType);
		}

		if( contentType in this.formats ){
			return this.formats[contentType].call(this, data, encoding);
		}
		else{
			this.status = 415; // unsupported content-type
			return null;
		}
	},

	send: function(status, data, encoding){
		this.status = status;
		if( data ) this.data = data;

		if( this.data ){
			this.data = this.format(this.data, encoding);
		}

		this.writeHead();

		if( this.data ){
			this.write(this.data, encoding);
		}

		this.end();
	},

	error: function(error){
		logger.log('error', error.stack);
		this.send(500, error);
	},

	start: function(){
		var self = this;
		var handlers = this.handlers, i = 0, j = handlers.length, handler, result;

		function nextHandler(error){
			// handler à retournée une erreur
			if( error ){
				return self.error(new Error('internal error'));
			}

			// aucun handler n'a match
			if( i >= j ){
				// not found
				return self.send(404);
			}

			handler = handlers[i];
			i++;

			try{
				result = handler.call(self, nextHandler);
			}
			catch(e){
				return self.error(new Error('handler internal error'));
			}
		}

		nextHandler();
	}
};

route.formats = {};
route.formats['text'] = function(data, encoding){
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
};
route.formats['application/json'] = function(data, encoding){
	var json = {
		status: this.status,
		headers: this.headers,
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
};

[
	'cookieParser', 'urlParser', 'queryParser', 'bodyParser',
	'methodOverride', 'params', 'jsonParam', 'responseTime', 'logger',
	'sendOptions', 'sendAction', 'sendPage', 'sendFile'
].forEach(function(name){
	var component = require('./service/' + name + '.js');

	if( typeof component == 'function' ) route.use(component);
	else{
		Object.append(route, component.extend);
		route.use(component.use);
	}
});

module.exports = route;
