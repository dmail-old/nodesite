module.exports = function(path, callback){
	var children = [];
	
	FS.iterate(path, function(error, name, stat, next){
		if( error ) return callback(error);
		if( !name ) return callback(null, children);
		
		var child = new FileInfo(path + '/' + name, stat);
		
		children.push(child);
		
		if( stat.isDirectory() ){
			FS.readdir(path + '/' + name, function(error, subChildren){
				if( error ) return callback(error);
				// pour les dossiers on met listed = true lorsqu'on sait qu'ils sont vides
				if( !subChildren || subChildren.length === 0 ) child.listed = true;
				next();
			});
		}
		else{
			next();
		}
	});
};