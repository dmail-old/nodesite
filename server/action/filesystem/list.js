module.exports = function(path, callback){
	var fileinfos = [];

	var FS = require('fs');
	var extra = require('fs.extra');

	extra.iterate(path, function(error, name, stat, next){
		if( error ) return callback(error);
		if( !name ) return callback(null, fileinfos);

		var fileinfo = new FileInfo(path + '/' + name, stat);

		fileinfos.push(fileinfo);

		if( stat.isDirectory() ){
			FS.readdir(path + '/' + name, function(error, names){
				if( error ) return callback(error);
				// pour les dossiers on met listed = true lorsqu'on sait qu'ils sont vides
				if( !names || names.length === 0 ) fileinfo.listed = true;
				next();
			});
		}
		else{
			next();
		}
	});
};
