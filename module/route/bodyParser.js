exports.extend = {
	bodySource: '',
	bodyParams: {},

	getRequestContentType: function(){
		var contentType = this.request.headers['content-type'];

		if( contentType ){
			contentType = this.parseContentType(contentType);
		}
		// RFC2616 section 7.2.1
		else{
			contentType = 'application/octet-stream';
		}

		return contentType;
	},

	getRequestEncoding: function(){
		var index, encoding, charset, search, contentType;

		search = 'charset=';
		contentType = this.request.headers['content-type'];

		if( contentType ){
			index = contentType.indexOf(search);

			if( index === -1 ){
				charset = 'utf8';
			}
			else{
				charset = contentType.slice(index + search.length);
				if( charset == 'utf-8' ) charset = 'utf8';
			}
		}
		else{
			charset = 'utf8';
		}

		return charset;
	},

	getRequestBody: function(callback, bind){
		var body = '';

		this.request.setEncoding(this.getRequestEncoding());
		this.request.on('aborted', function(){
			callback.call(bind, new Error('Request aborted'));
		});
		this.request.on('data', function(data){
			body+= data;

			if( body.length > 1e6 ){
				callback.call(bind, new Error('Request Entity Too Large'));
				this.connection.destroy();
			}

		});
		this.request.on('end', function(){
			callback.call(bind, null, body);
		});
	}
};

// http://www.senchalabs.org/connect/
// need to do like connect to support multipart

// multipart parser
// https://github.com/mcavage/node-restify/blob/master/lib/plugins/multipart_parser.js

exports.use = function bodyParser(next){
	if( this.method == this.METHODS.POST || this.method == this.METHODS.PUT ){
		var contentType = this.getRequestContentType();

		this.getRequestBody(function(error, body){

			if( error ) return next(error);
			this.bodySource = body;

			if( contentType == 'application/json' ){
				this.bodyParams = this.parseJSON(body);
			}
			else if( contentType == 'application/x-www-form-urlencoded' ){
				// check with connect
				this.bodyParams = this.parseQueryString(body);
			}
			else if( contentType == 'multipart/form-data' ){
				// TODO
			}

			if( this.bodyParams == null ) return next(new Error('invalid body params'));
			next();

		}, this);
	}
	else{
		next();
	}
};
