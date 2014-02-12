module.exports = function(path, destinationPath, callback){

	var FS = require('fs');
	var extra = require('fs.extra');

	FS.stat(path, function(error, stat){

		if( error ) return callback(error);
		if( stat.isDirectory() ) return extra.copydirRecursive(path, destinationPath, callback);
		return extra.copy(path, destinationPath, callback);

	});

};
