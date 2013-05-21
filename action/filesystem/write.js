module.exports = function(path, content, encoding, callback){
	
	FS.writeFile(path, content, encoding, callback);
	
};