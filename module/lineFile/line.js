/*

Line is an line in a File

byte: number of the bute where the line starts in the file
data: the line as a string

*/

var Line = {
	byte: 0,
	data: '',

	create: function(byte, data){
		this.byte = byte;
		if( arguments.length > 1 ){
			this.setData(data);
		}
	},

	setData: function(data){
		this.data = data;
	},

	empty: function(){
		this.data = '';
	}
};

module.exports = Line;
