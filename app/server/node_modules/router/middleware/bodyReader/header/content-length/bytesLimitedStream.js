/*
https://github.com/stream-utils/raw-body/blob/master/index.js
*/
var Duplex = new require('stream').Duplex;
var util = require('util');

function BytesLimitedStream(options){
	this.bytesReceived = 0;
	
	var stream = Duplex.call(this, options);

	stream.on('end', function(){
		if( typeof this.bytesExpected != 'number' && this.bytesReceived != this.bytesExpected ){
			this.emit('error', this.createInvalidSizeError(this.bytesReceived, this.bytesExpected));
		}
	});

	return stream;
}

util.inherits(BytesLimitedStream, Duplex);

BytesLimitedStream.prototype.bytesReceived = null;
BytesLimitedStream.prototype.bytesExpected = null;
BytesLimitedStream.prototype.byteLimit = null;
BytesLimitedStream.prototype.createInvalidSizeError = function(received, expected){
	var error = new Error('stream.size.invalid');
	error.received = received;
	error.expected = expected;
	return error;
};
BytesLimitedStream.prototype.createTooLargeError = function(received, limit){
	var error = new Error('stream.size.toolarge');
	error.received = received;
	error.limit = limit;
	return error;
};

BytesLimitedStream.prototype._read = BytesLimitedStream.prototype.read;
BytesLimitedStream.prototype._write = function(chunk, encoding){
	this.bytesReceived+= chunk.length;
	this.emit('progress', this.bytesReceived, this.bytesExpected);

	if( typeof this.byteLimit == 'number' && this.bytesReceived > this.byteLimit ){
		this.emit('error', this.createTooLargeError(this.bytesReceived, this.byteLimit));
	}
	else{
		this.push(chunk, encoding);
	}
};

module.exports = BytesLimitedStream;