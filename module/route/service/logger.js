module.exports = function logger(next){
	this.emitter.on('header', function(){
		var level, message = '', status;

		if( this.status >= 500 ){
			level = 'error';
			status = String.setType(this.status, 'red');
		}
		else if( this.status >= 400 ){
			level = 'warn';
			status = String.setType(this.status, 'yellow');
		}
		else if( this.status >= 300 ){
			level = 'info';
			status = String.setType(this.status, 'blue');
		}
		else if( this.status >= 200 ){
			level = 'info';
			status = String.setType(this.status, 'green');
		}
		else{
			level = 'info';
			status = this.status;
		}

		if( this.user ){
			message+= '[' + this.user.name + '] ';
		}

		message+= String.setType(this.method, 'pink');
		message+= ' ' + status;
		message+= ' ' + String.setType(this.url.pathname, 'pink');

		if( this.args ){
			message+= ' ' + String.setType(this.args, 'b');
		}

		if( this.hasHeader('x-response-time') ){
			message+= ' ' + String.setType(this.getHeader('x-response-time') + 'ms', 'b');
		}

		global.logger.log(
			level,
			message
		);

	});

	next();
};
