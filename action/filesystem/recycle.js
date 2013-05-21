module.exports = function(path, callback){
	
	FS.rename(path, Path.dirname(path) + Path.sep + Path.basename(path, '.trash'), callback);
	
};