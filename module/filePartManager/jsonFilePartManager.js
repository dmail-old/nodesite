var FilePartManager = require('./filePartManager.js');
var JSONFilePart = require('./jsonFilePart.js');

var JSONFilePartManager = FilePartManager.extend({
	partConstructor: JSONFilePart,

	checkPart: function(part){
		var error = FilePartManager.checkPart.call(this, part);
		if( !error && part.JSONError ){
			error = part.JSONError;
		}
		return error;
	}
});

module.exports = JSONFilePartManager;