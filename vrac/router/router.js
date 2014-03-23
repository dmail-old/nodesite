var Router = {
	routes: [],
	fileSystem: require('fs'),

	getPath: function(path){
		return global.CLIENT_PATH + '/' + path;
	},

	getPagePath: function(filename){
		if( !filename.endsWith('.page') ) filename+= '.page';
		return this.getPath(filename);
	},

	getFileType: function(filename){
		var stat = this.fileSystem.statSync(filename);

		if( stat instanceof Error ){
			return null;
		}
		if( stat.isFile() ){
			return 'file';
		}
		if( stat.isDirectory() ){
			return 'directory';
		}
	},

	hasPage: function(filename){
		if( this.getFileType(filename) == 'file' ){
			return filename;
		}
		return false;
	},

	// resolve the filename we are searching for
	resolve: function(path){
		// remove first '/'
		if( path[0] == '/' ) path = path.slice(1);
		if( path === '' ) path = 'index';

		var parts = path.split('/'), i = 0, j = parts.length, partName = '', pagePath;

		for(;i<j;i++){
			if( i !== 0 ) partName+= '/';
			partName+= parts[i];
			pagePath = this.getPagePath(partName);

			if( this.hasPage(pagePath) ){
				return pagePath;
			}
		}

		return false;
	},

	match: function(path){
		return Boolean(this.resolve(path));
	}
};

module.exports = Router;