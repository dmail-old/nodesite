var ModuleTestCollector = {
	path: require('path'),
	fileSystem: require('fs'),
	testFolderName: 'test',
	testFileName: 'test.js',

	filter: function(testFile){
		return testFile.slice(-3) === '.js';
	},

	collect: function(path){
		var tests = [], parts = path.split(this.path.sep), dirname, testFolderPath, testPath, isDir;

		if( parts[parts.length - 1] !== this.testFolderName ){
			dirname = this.path.dirname(path);
			testPath = dirname + this.path.sep + this.testFileName;

			if( this.fileSystem.existsSync(path) ){
				tests.push(path);
			}
			else{
				testFolderPath = dirname + this.path.sep + this.testFolderName;
				try{
					isDir = this.fileSystem.statSync(testFolderPath).isDirectory();
				}
				catch(e){
					isDir = false;
				}

				if( isDir ){
					// any files in it is a test
					tests = this.fileSystem.readdirSync(testFolderPath).filter(this.filter, this).map(function(name){
						return path + this.path.sep + name;
					}, this);
				}
			}
		}

		return tests;
		
	}
};

module.exports = ModuleTestCollector;