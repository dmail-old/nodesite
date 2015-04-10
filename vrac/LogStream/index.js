var LogStream = {
	stream: null,

	init: function(stream){
		this.stream = stream;
		if( this.stream.readable ) this.read();
	},

	read: function(){
		// https://github.com/visionmedia/log.js#reader

		var buffer = '', self = this, stream = this.stream;

		stream.setEncoding('utf8');
		stream.on('data', function(chunk){
			buffer+= chunk;
			if( '\n' != buffer[buffer.length - 1] ) return;

			buffer.split('\n').map(function(line){
				if( !line.length ) return;
				try{
					var captures = line.match(/^\[([^\]]+)\] (\w+) (.*)/);
					var obj = {
						date: new Date(captures[1]),
						level: logger.getLevelIndex(captures[2]),
						levelString: captures[2],
						msg: captures[3]
					};
					self.emit('line', obj);
				}
				catch(err){
					// Ignore
				}
			});
			buffer = '';
		});

		stream.on('end', function(){
			self.emit('end');
		});
	},

	write: function(data){
		this.stream.write(data);
	}
};

var fs = require('fs');
var Stream = require('stream');
module.exports = {
	new: function(stream){

		if( typeof stream == 'string' ){
			stream = fs.createWriteStream(stream, {flags: 'a', encoding: 'utf8', mode: 0666});
		}
		else if( typeof stream == 'undefined' ){
			stream = process.stdout;
		}
		else if( stream.write || stream.read ){ // instanceof Stream.Writable || stream instanceof Stream.Readable ){
			stream = stream;
		}
		else{
			throw new TypeError('stream expected');
		}

		return LogStream.create(stream);
	}
};