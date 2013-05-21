module.exports = function(path, callback){	
	return callback();
	
	FS.stat(path, function(error, stat){	
		if( error ) return callback(error);
		
		if( stat.isDirectory() ){
			FS.rmdirRecursive(path, callback);
		}
		else{
			FS.unlink(path, callback);
		}
	});
	
};