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
	warnAboutFolderWithModuleSignature: true,

	isModule: function(path){
		// one of his parent is node_modules but the fileName != 'node_modules'
		var directories = path.split(this.path.sep);
		var index = directories.indexOf(this.moduleFolderName);
		var lastPart = directories[directories.length - 1];

		return index !== -1 && index !== directories.length - 1;// && lastPart != this.testFolderName;
	},

	collect: function(path, ignoreFile){
		var fileNames = this.fileSystem.readdirSync(path), i = 0, j = fileNames.length, fileName, filePath;
		var modulePaths = [], isModule, modulePath;

		for(;i<j;i++){
			fileName = fileNames[i];	
			filePath = path + this.path.sep + fileName;

			if( this.fileSystem.statSync(filePath).isDirectory() ){
				isModule = this.isModule(filePath);

				if( isModule ){
					try{
						// locate module path for this folder
						modulePath = require.resolve(filePath);
						modulePaths.push(modulePath);
					}
					catch(e){
						if( this.warnAboutFolderWithModuleSignature ){
							console.log(filePath, 'has a module signature but does not provide modules');
						}						
					}
				}

				modulePaths = modulePaths.concat(this.collect(filePath, isModule));
			}
			else if( !ignoreFile ){
				modulePaths.push(filePath);
			}
		}

		return modulePaths;
	}
};

module.exports = ModuleCollector;