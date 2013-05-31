/* global Chain, Emitter, Options */

Object.toQueryString = function(object, base){
	var queryString = [];

	Object.forEach(object, function(value, key){
		if( base ) key = base + '[' + key + ']';
		var result;

		if( typeof value == 'object' ){
			if( typeof value.toQueryString == 'function' ) value = value.toQueryString();
			result = Object.toQueryString(value, key);
		}
		else{
			result = key + '=' + encodeURIComponent(value);
		}

		if( value != null ) queryString.push(result);
	});

	return queryString.join('&');
};

Array.prototype.toQueryString = function(){
	var queryString = {};

	this.forEach(function(value, i){ queryString[i] = value; });

	return queryString;
};

Element.prototype.toQueryString = function(){
	var queryString = [];

	this.getElements(function(el){ return el.tagName.match(/input|select|textarea/i); }).each(function(el){
		var type = el.type, value;

		if( !el.name || el.disabled || type == 'submit' || type == 'reset' || type == 'file' || type == 'image' ) return;
		if( el.get('tag') == 'select' ){
			value = el.getSelected().map(function(opt){ return opt.get('value'); });
		}
		else if( (type == 'radio' || type == 'checkbox') && !el.checked ){
			value = null;
		}
		else{
			value = el.get('value');
		}

		if( !(value instanceof Array) ) value = [value];
		value.forEach(function(val){
			if( typeof val != 'undefined' ) queryString.push(encodeURIComponent(el.name) + '=' + encodeURIComponent(val));
		});
	});

	return queryString.join('&');
};

var progressSupport = 'onprogress' in new XMLHttpRequest();

var Request = this.Request = new Class({
	options: {/*
		onRequest: function(){},
		onLoadstart: function(event, xhr){},
		onProgress: function(event, xhr){},
		onComplete: function(){},
		onCancel: function(){},
		onSuccess: function(responseText, responseXML){},
		onFailure: function(xhr){},
		onException: function(headerName, value){},
		onTimeout: function(){},
		user: '',
		password: '',*/
		url: '',
		data: '',
		headers: {
			'X-Requested-With': 'XMLHttpRequest',
			'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
		},
		async: true,
		format: false,
		method: 'post',
		link: 'ignore',
		isSuccess: null,
		emulation: true,
		urlEncoded: true,
		encoding: 'utf-8',
		//evalScripts: false,
		//evalResponse: false,
		timeout: 0,
		noCache: false
	},

	constructor: function(options){
		this.resetXhr();
		this.setOptions(options);
		this.headers = this.options.headers;
		this.resetChain();
	},

	resetXhr: function(){
		this.xhr = new XMLHttpRequest();
	},

	onStateChange: function(){
		var xhr = this.xhr;
		if( xhr.readyState != 4 || !this.running ) return;
		this.running = false;
		this.status = 0;

		try{
			var status = xhr.status;
			this.status = (status == 1223) ? 204 : status;
		}
		catch(e){}

		xhr.onreadystatechange = Function.EMPTY;
		if( progressSupport ) xhr.onprogress = xhr.onloadstart = Function.EMPTY;
		clearTimeout(this.timer);

		this.response = {text: this.xhr.responseText || '', xml: this.xhr.responseXML};
		if( this.options.isSuccess.call(this, this.status) ){
			this.success(this.response.text, this.response.xml);
		}
		else{
			this.failure();
		}
	},

	isSuccess: function(){
		var status = this.status;
		return (status >= 200 && status < 300);
	},

	isRunning: function(){
		return !!this.running;
	},

	success: function(text, xml){
		this.onSuccess(text.stripScripts(), xml);
	},

	onSuccess: function(){
		this.applyListeners('complete', arguments).applyListeners('success', arguments).callChain();
	},

	failure: function(){
		this.onFailure();
	},

	onFailure: function(){
		this.emit('complete').emit('failure', this.xhr);
	},

	loadstart: function(event){
		this.emit('loadstart', event, this.xhr);
	},

	progress: function(event){
		this.emit('progress', event, this.xhr);
	},

	timeout: function(){
		this.emit('timeout', this.xhr);
	},

	setHeader: function(name, value){
		this.headers[name] = value;
		return this;
	},

	getHeader: function(name){
		try{
			return this.xhr.getResponseHeader(name);
		}
		catch(e){
			return null;
		}
	},

	check: function(){
		if( !this.running ) return true;

		switch(this.options.link){
		case 'cancel':
			this.cancel();
			return true;
		case 'chain':
			this.chain(this.send, this, arguments);
			return false;
		}

		return false;
	},

	send: function(options){
		if( !this.check(options) ) return this;

		this.options.isSuccess = this.options.isSuccess || this.isSuccess;
		this.running = true;

		if( typeof options == 'string' ) options = {data: options};

		var old = this.options;
		options = Object.append({data: old.data, url: old.url, method: old.method}, options);
		var data = options.data, url = String(options.url), method = options.method.toLowerCase();

		if( typeof data == 'object' ) data = Object.toQueryString(data);

		if( this.options.format ){
			var format = 'format=' + this.options.format;
			data = (data) ? format + '&' + data : format;
		}

		if( this.options.emulation && !['get', 'post'].contains(method)){
			var _method = '_method=' + method;
			data = (data) ? _method + '&' + data : _method;
			method = 'post';
		}

		if( this.options.urlEncoded && ['post', 'put'].contains(method) ){
			var encoding = this.options.encoding ? '; charset=' + this.options.encoding : '';
			this.headers['Content-type'] = 'application/x-www-form-urlencoded' + encoding;
		}

		if( !url ) url = document.location.pathname;

		var trimPosition = url.lastIndexOf('/');
		if( trimPosition > -1 && (trimPosition = url.indexOf('#')) > -1 ) url = url.substr(0, trimPosition);

		if( this.options.noCache ) url += (url.contains('?') ? '&' : '?') + String.uniqueID();

		if( data && method == 'get' ){
			url+= (url.contains('?') ? '&' : '?') + data;
			data = null;
		}

		var xhr = this.xhr;
		if( progressSupport ){
			xhr.onloadstart = this.loadstart.bind(this);
			xhr.onprogress = this.progress.bind(this);
		}

		xhr.open(method.toUpperCase(), url, this.options.async, this.options.user, this.options.password);
		if( this.options.user && 'withCredentials' in xhr ) xhr.withCredentials = true;

		xhr.onreadystatechange = this.onStateChange.bind(this);

		for(var header in this.headers){
			try{
				xhr.setRequestHeader(header, this.headers[header]);
			}
			catch(e){
				this.emit('exception', header, this.headers[header]);
			}
		}

		this.emit('request', options);
		xhr.send(data);
		if( !this.options.async ) this.onStateChange();
		else if( this.options.timeout ) this.timer = setTimeout(this.timeout.bind(this), this.options.timeout);
		return this;
	},

	cancel: function(){
		if( !this.running ) return this;
		this.running = false;
		var xhr = this.xhr;
		xhr.abort();
		clearTimeout(this.timer);
		xhr.onreadystatechange = Function.EMPTY;
		if( progressSupport ) xhr.onprogress = xhr.onloadstart = Function.EMPTY;
		this.xhr = new XMLHttpRequest();
		this.emit('cancel');
		return this;
	}
});

Request.implement(Emitter, Options, Chain);
