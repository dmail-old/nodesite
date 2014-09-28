var TestCollector = {
	fileSystem: require('fs'),
	path: require('path'),
	moduleFolderName: 'node_modules',
	testFolderName: 'test',
	testFileName: 'test.js',

	getFileNames: function(path){
		return this.fileSystem.readdirSync(path);
	},

	getStat: function(path){
		return this.fileSystem.statSync(path);
	},

	isDirectory: function(path){
		return this.getStat(path).isDirectory();
	},

	isModuleFolder: function(path){
		return this.path.basename(path) == this.moduleFolderName;
	},

	isModule: function(path){
		// one of his parent is node_modules but the fileName != 'node_modules'
		var directories = path.split(this.path.sep);
		var index = directories.indexOf(this.moduleFolderName);
		var lastPart = directories[directories.length - 1];

		return index !== -1 && index !== directories.length - 1 && lastPart != this.testFolderName;
	},

	hasTest: function(modulePath){
		var path = this.path.dirname(modulePath) + this.path.sep  + this.testFolderName;
		var isDir;

		try{
			isDir = this.isDirectory(path);
		}
		catch(e){
			return false;
		}

		if( isDir ){
			// any files in it is a test
			return this.getFileNames(path).length !== 0;
		}
		else{
			path = this.path.dirname(path) + this.path.sep + this.testFileName;
			return this.fileSystem.existsSync(path);
			// this files must exists
		}
	},

	collect: function(path, ignoreFile){
		// il faudrait commencer par choper tous les node_modules folder de l'application
		// une fois qu'on les as tous
		// on regarde les ficheir qu'il y a dedans
		// mais sinon on fait le sdeux en même temps

		var fileNames = this.getFileNames(path), i = 0, j = fileNames.length, fileName, filePath;
		var files = [], isModule, modulePath, isDirectory;

		for(;i<j;i++){
			fileName = fileNames[i];	
			filePath = path + this.path.sep + fileName;
			isDirectory = this.isDirectory(filePath);

			if( isDirectory ){
				isModule = this.isModule(filePath);

				if( isModule ){
					try{
						// locate module path for this folder
						modulePath = require.resolve(filePath);
					}
					catch(e){
						console.log('module not found for ', filePath);
					}

					if( this.hasTest(modulePath) ){
						files.push(modulePath);
					}
				}

				files = files.concat(this.collect(filePath, isModule));
			}
			else if( !ignoreFile ){
				if( this.hasTest(filePath) ){
					files.push(filePath);
				}
			}
		}

		return files;
	}
};

module.exports = TestCollector;