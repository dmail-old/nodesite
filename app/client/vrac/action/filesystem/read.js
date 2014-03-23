module.exports = function(path, encoding, callback){
	// à faire dans write et dans insert aussi
	if( !['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'binary', 'hex'].contains(encoding) ){
		return callback(new Error('unknown encoding' + encoding));
	}
	
	FS.readFile(path, encoding, callback);
	
};