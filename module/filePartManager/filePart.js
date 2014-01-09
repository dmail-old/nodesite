/*

Part of a file content

byte: number of the byte where the part starts in the file content
data: the part content as a string

*/

var FilePart = {
	byte: 0,
	data: '',
	file: null,

	create: function(data, byte){
		if( arguments.length > 0 ){
			this.setData(data);		
			if( arguments.length > 1 ){
				if( typeof byte != 'number' ){
					throw new TypeError('byte should be a number');
				}
				this.byte = byte;
			}
		}
	},

	byteLength: function(){
		return this.file.byteLength(this.data);
	},

	setData: function(data){
		this.data = data;
	},

	empty: function(){
		this.data = '';
	},

	replace: function(part, callback, bind){
		if( this.file ){
			this.file.replacePart(this, callback, bind || this);
		}
		return this;
	},

	remove: function(callback, bind){
		if( this.file ){
			this.file.removePart(this, callback, bind || this);
		}
		return this;
	},

	toString: function(){
		return this.data;
	}
};

module.exports = FilePart;
