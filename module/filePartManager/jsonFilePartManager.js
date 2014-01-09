var File = require('./file.js');
var JSONFilePart = require('./jsonFilePart.js');

var JSONFilePartManager = File.extend({
	createPart: function(byte, data){
		try{
			return JSONFilePart.new(byte, data);
		}
		catch(e){
			// JSON malformé
		}
	}
});