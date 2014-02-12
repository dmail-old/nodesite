/*

description: part of a file content

*/

var FilePart = {
	byte: null,				// byte index where the part starts in the file content
	buffer: new Buffer(0),	// the part content as buffer
	bufferError: null,		// an error caused by setBuffer

	create: function(buffer, encoding){
		if( arguments.length > 0 ){
			this.setBuffer(buffer, encoding);
		}
	},

	setBuffer: function(buffer, encoding){
		if( typeof buffer == 'string' ){
			buffer = new Buffer(buffer, encoding);
		}

		if( Buffer.isBuffer(buffer) ){
			this.buffer = buffer;
		}
		else{
			this.bufferError = new TypeError('not a buffer');
		}
	},

	setData: function(data){
		this.data = data;
	},

	empty: function(){
		this.buffer = FilePart.buffer;
		return this;
	},

	toString: function(encoding){
		return this.buffer.toString(encoding);
	}
};

module.exports = FilePart;
