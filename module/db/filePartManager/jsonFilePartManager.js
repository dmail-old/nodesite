var FilePartManager = require('./filePartManager.js');
var JSONFilePart = require('./jsonFilePart.js');

var JSONFilePartManager = FilePartManager.extend({
	partConstructor: JSONFilePart
});

module.exports = JSONFilePartManager;