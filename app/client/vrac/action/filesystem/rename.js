module.exports = function(path, name, callback){

	FS.rename(path, Path.dirname(path) + Path.sep + name, callback);
	
};