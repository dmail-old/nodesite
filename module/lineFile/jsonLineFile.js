var lineFile = require('./lineFile.js');
var jsonLine = require('./jsonLine.js');

var jsonLineFile = lineFile.extend({
	createLine: function(byte, data){
		return jsonLine.new(byte, data);
	}
});