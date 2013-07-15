module.exports = function(path, content, encoding, callback){

	if( !['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'binary', 'hex'].contains(encoding) ){
		return callback(new Error('unknown encoding' + encoding));
	}

	FS.writeFile(path, content, encoding, callback);

};
