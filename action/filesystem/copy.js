module.exports = function(path, destinationPath, callback){	
		
	FS.stat(path, function(error, stat){	
		if( error ) return callback(error);	
		
		if( stat.isDirectory() ) return  FS.copydirRecursive(path, destinationPath, callback);
		
		return FS.copy(path, destinationPath, callback);
	});
	
};