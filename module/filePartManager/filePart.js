/*

Part of a file content

byte: number of the byte where the part starts in the file content
buffer: the part data as buffer

*/

var FilePart = {
	byte: 0,
	buffer: new Buffer(0),
	file: null,

	create: function(buffer, byte){
		if( arguments.length > 0 ){
			this.setBuffer(buffer);		
			if( arguments.length > 1 ){
				if( typeof byte != 'number' ){
					throw new TypeError('byte should be a number');
				}
				this.byte = byte;
			}
		}
	},
	
	setBuffer: function(buffer){
		this.buffer = buffer;
		this.data = buffer.toString();
	},

	empty: function(){
		this.buffer = FilePart.buffer;
	},

	toString: function(encoding){
		return this.buffer.toString(encoding);
	}
};

module.exports = FilePart;
