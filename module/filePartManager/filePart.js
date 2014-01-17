/*

Part of a file content

byte: number of the byte where the part starts in the file content
buffer: the part content as buffer

*/

var FilePart = {
	byte: null,
	buffer: new Buffer(0),

	create: function(buffer, encoding){
		if( arguments.length > 0 ){
			this.setBuffer(buffer, encoding);
		}
	},

	setBuffer: function(buffer, encoding){
		if( typeof buffer == 'string' ){
			buffer = new Buffer(buffer, encoding);
			this.data = buffer;
		}
		else{
			this.data = buffer.toString();
		}

		if( !Buffer.isBuffer(buffer) ){
			throw new TypeError('not a buffer');
		}

		this.buffer = buffer;

		return buffer;
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
