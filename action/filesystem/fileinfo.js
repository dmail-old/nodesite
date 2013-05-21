module.exports = function(path, callback){

	FS.stat(path, function(error, stat){
		if( error ) return callback(error);
		
		var fileinfo = new FileInfo(path, stat);
		
		if( stat.isDirectory() ){
			callScript(__dirname + '/list.js', this, path, function(error, children){
				if( error ) return callback(error);
				
				fileinfo.children = children;				
				callback(null, fileinfo);
			});
		}
		else{
			callback(null, fileinfo);
		}
	});
	
};