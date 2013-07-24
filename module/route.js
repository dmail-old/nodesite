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
	headers: null,
	status: null,
	handlers: [],

	create: function(request, response){
		this.request = request;
		this.response = response;
		this.headers = {};
		this.method = this.request.method;
	},

	use: function(filter, handle){
		if( arguments.length == 1 ){
			handle = filter;
			filter = Function.TRUE;
		}

		this.handlers.push({
			filter: filter,
			handle: handle
		});
	},

	isFromAjax: function(){
		return this.request.headers[this.AJAX_HEADER_NAME] == this.AJAX_HEADER_VALUE;
	},

	setHeader: function(name, value){
		this.headers[name] = value;
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
		if( !status ) status = this.status || 500;
		if( !headers ) headers = this.headers;

		var contentType = this.parseContentType(headers['content-type']);
		if( contentType && !this.accept(contentType) ){
			logger.warn(contentType + ' not in accept header');
		}

		var codes = require('http').STATUS_CODES;
		if( !(status in codes) ) status = 500;
		var desc = codes[status];

		this.response.writeHead(status, desc, headers);

		var level = 'info';
		if( status == 404 ) level = 'warn';
		var method;
		if( this.isFromAjax() ) method = 'AJAX';
		else method = this.method;

		logger.log(level, String.setType(method, 'function') +' '+ status +' '+ String.setType(this.url.pathname, 'path'));
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

		if( data ){
			data = this.format(data, encoding);
		}

		this.writeHead();

		if( data ){
			this.write(data, encoding);
		}

		this.end();
	},

	error: function(error){
		logger.log('error', error);
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

			if( handler.filter.call(self) === true ){
				result = handler.handle.call(self, nextHandler);
			}
			else{
				nextHandler();
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

route.isMethod = function(method){
	if( method == 'all' || method == '*' ) return true;
	return this.method.toLowerCase() === method;
};

['get', 'post', 'put', 'delete', 'options', 'all'].forEach(function(method){
	route[method] = function(filter, handle){
		this.use(function(){
			return this.isMethod(method) && filter.call(this);
		}, handle);
	};
});

[
	'cookieParser', 'urlParser', 'queryParser', 'bodyParser',
	'methodOverride', 'params', 'jsonParam'
].forEach(function(name){
	var component = require('./route/' + name + '.js');

	if( typeof component == 'function' ) route.use(component);
	else{
		Object.append(route, component.extend);
		route.use(component.use);
	}
});

// services
route.sendService = function(type){
	var service;

	try{
		service = require('./services/' + type);
	}
	catch(e){
		this.send(501);
		return;
	}

	try{
		service.new(this);
	}
	catch(e){
		return this.error(e);
	}
};

// options service
route.options(Function.TRUE, function(){
	return this.sendService('options');
});

// action service
route.all(function(){
	return this.url.pathname.slice(0, this.url.pathname.indexOf('/', 1)) == '/action';
}, function(){
	return this.sendService('action');
});

// page service
route.get(function(){
	var pathname = this.url.pathname;

	// index page
	if( pathname === '/' ) return true;
	if( pathname === '/app.html' ) return true;
	// html files handled by page service
	if( pathname.endsWith('.html') ) return true;

	var slash = pathname.indexOf('/', 1);

	// on demande quelque chose à la racine, sans extension ou finissant par .js
	if( slash === -1 && (!pathname.contains('.') || pathname.endsWith('.js')) ){
		return true;
	}

	return false;
}, function(){
	return this.sendService('page');
});

// file service
route.use(
	function(){
		return this.method == 'HEAD' || this.method == 'GET';
	},
	function(){
		return this.sendService('file');
	}
);


module.exports = route;
