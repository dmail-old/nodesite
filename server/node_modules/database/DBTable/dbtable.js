var RecordManager = require('../recordManager');
var Path = require('path');

var DBTable = RecordManager.extend({
	name: null,

	setPath: function(path){
		RecordManager.setPath.call(this, path);
		this.name = Path.basename(this.path, Path.extname(this.path));
	}
});

module.exports = DBTable;