/*

doit retourner une liste de module et une liste de tests associé à ces modules

ensuite je require tous ces modules
une fois tous require, je les ordonne
puis je crée un testGroup pour chaque module
je test dans l'ordre


*/

var ModuleCollector = {
	fileSystem: require('fs'),
	path: require('path'),
	moduleFolderName: 'node_modules',
	badSignature: null,

	hasModuleSignature: function(path){
		// one of his parent is node_modules but the fileName != 'node_modules'
		var directories = path.split(this.path.sep);
		var index = directories.indexOf(this.moduleFolderName);

		return index > -1 && index < directories.length - 1;
	},

	filter: function(fileName){
		return fileName == '.git' || fileName == '.gitignore' || fileName == '.gitattributes';
	},

	collect: function(path, ignoreFile){
		var fileNames = this.fileSystem.readdirSync(path), i = 0, j = fileNames.length, fileName, filePath;
		var modulePaths = [], hasModuleSignature, modulePath;

		for(;i<j;i++){
			fileName = fileNames[i];

			if( this.filter(fileName) ) continue;

			filePath = path + this.path.sep + fileName;			

			if( this.fileSystem.statSync(filePath).isDirectory() ){
				hasModuleSignature = this.hasModuleSignature(filePath);
				modulePath = null;

				if( hasModuleSignature ){
					try{
						// locate module path for this folder
						modulePath = require.resolve(filePath);
					}
					catch(e){
						if( this.badSignature ){
							this.badSignature.push(filePath);							
						}						
					}

					if( modulePath ) modulePaths.push(modulePath);
				}

				modulePaths = modulePaths.concat(this.collect(filePath, modulePath != null));
			}
			/*
			else if( !ignoreFile && this.hasModuleSignature(filePath) ){
				modulePaths.push(filePath);
			}
			*/
		}

		return modulePaths;
	}
};

module.exports = ModuleCollector;