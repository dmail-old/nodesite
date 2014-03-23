module.exports = function(path, destinationPath, callback){

	FS.rename(path, destinationPath, callback);
	
};