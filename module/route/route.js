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
		if( typeof handler != 'function' ){
			var error = new TypeError('route.use expect a function handler '+ handler + ' given');
			console.error(error.stack);
		}
		else{
			this.handlers.push(handler);
		}
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

		return 'text/plain';
	},

	writeHead: function(status, headers){
		if( status ) this.status = status;
		if( headers ) this.headers = headers;

		this.emitter.emit('header');

		var codes = require('http').STATUS_CODES;
		if( !(this.status in codes) ) this.status = 500;
		var desc = codes[this.status];

		if( this.hasHeader('content-type') ){
			var contentType = this.getContentType();
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
		//logger.log('error', error.stack);
		console.log(error.stack);
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
				console.error('handler internal error', e.stack);
				return self.error(e);
			}
		}

		nextHandler();
	}
};

route.formats = require('./format.js');

[
	'cookieParser', 'urlParser', 'queryParser', 'bodyParser',
	'methodOverride', 'params', 'jsonParam', 'responseTime', 'logger',
	'sendCORS', 'sendAction', 'sendPage', 'sendFile'
].forEach(function(name){
	var component = require('./service/' + name + '.js');

	if( typeof component == 'function' ) route.use(component);
	else{
		if( typeof component.extend == 'object' ) Object.append(route, component.extend);
		if( typeof component.use == 'function' ) route.use(component.use);
	}
});

// sendCORS
route.use(function useCORS(next){
	if( this.method == this.METHODS.OPTIONS ){
		this.sendCORS();
	}
	else{
		next();
	}
});

// sendAction
route.use(function useAction(next){
	if( this.url.pathname.slice(0, this.url.pathname.indexOf('/', 1)) == '/action' ){
		this.sendAction(this.url.pathname);
	}
	else{
		next();
	}
});

// sendFile
route.use(function useFile(next){

	function isFileRequest(){
		if( this.method != 'HEAD' && this.method != 'GET' ) return false;

		var pathname = this.url.pathname;
		var slash = pathname.indexOf('/', 1);
		var dirname = this.url.pathname.slice(0, this.url.pathname.indexOf('/', 1)).slice(1);

		// on demande quelque chose à la racine, ayant une extension
		if( slash === -1 && pathname.contains('.') ){
			// les fichiers js à la racine ne sont pas des fichiers mais plutot des page à la php
			return !pathname.endsWith('.js');
		}

		if( dirname == 'css' || dirname == 'js' || dirname == 'img' ){
			return true;
		}

		return false;
	}

	if( isFileRequest.call(this) ){
		this.sendFile(this.url.pathname);
	}
	else{
		next();
	}
});

// sendPage, always sendPage to every other URL
route.use(function usePage(next){
	this.sendPage();
});

module.exports = route;
