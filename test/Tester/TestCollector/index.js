/*

doit retourner une liste de module et une liste de tests associé à ces modules

ensuite je require tous ces modules
une fois tous require, je les ordonne
puis je crée un testGroup pour chaque module
je test dans l'ordre


*/

var ModuleTest = {
	path: null,
	tests: null,
	module: null,
	error: null,

	emptyCache: function(){
		for(var key in require.cache){
			delete require.cache[key];
		}
	},

	init: function(path, tests){
		this.path = path;
		if( typeof tests == 'string' ) tests = [tests];
		this.tests = tests;

		try{
			//this.emptyCache();			
			require(this.path);
			this.module = require.cache[this.path];
			// il faut supprimer tous les modules qui ont été require par celui-ci
			// ou alors il faudrais les recenser mais partons là dessus pour le moment
			// il faut emptyCache parce que sinon les appels à require dans le modules
			// sont ignorés, ils sont récup depuis le cache
			// du coup on peut penser, à tort, qu'un module n'a pas de dépendence
			this.emptyCache();
		}
		catch(e){
			var error;

			if( e.code === 'MODULE_NOT_FOUND' ){
				e.message = this + ' is requiring a module that cannot be found' + '\n' + e.message;
			}
			else if( e.type === 'ReferenceError' ){
				e.message = this + ' contains reference error';
			}

			throw e;
		}
	},

	get children(){
		return this.module.children;
	},

	get parent(){
		return this.module.parent;
	},

	toString: function(){
		return this.path.replace(global.APP_PATH, '').slice(1);
	}
};

var TestCollector = {
	fileSystem: require('fs'),
	path: require('path'),
	moduleFolderName: 'node_modules',
	testFolderName: 'test',
	testFileName: 'test.js',
	ModuleTest: ModuleTest,
	warnAboutFolderWithModuleSignature: true,

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

	filter: function(testFile){
		return testFile.slice(-3) === '.js';
	},

	getTestFiles: function(modulePath){
		var path = this.path.dirname(modulePath) + this.path.sep + this.testFolderName, isDir;

		try{
			isDir = this.isDirectory(path);
		}
		catch(e){
			isDir = false;
		}

		if( isDir ){
			// any files in it is a test
			return this.getFileNames(path).filter(this.filter, this).map(function(name){
				return path + this.path.sep + name;
			}, this);
		}
		else{
			//path = modulePath + this.path.sep + this.testFileName;
			path = this.path.dirname(path) + this.path.sep + this.testFileName;

			if( this.fileSystem.existsSync(path) ) return path;

			/*
			

			if( this.fileSystem.existsSync(path) ) return path;
			*/

			return null;
		}
	},

	createModuleTest: function(path, tests){
		return this.ModuleTest.new(path, tests);
	},

	addModuleTests: function(modulePath, files){
		var testFiles = this.getTestFiles(modulePath);

		if( testFiles ){
			files.push(this.createModuleTest(modulePath, testFiles));
		}
	},

	collect: function(path, ignoreFile){
		// il faudrait commencer par choper tous les node_modules folder de l'application
		// une fois qu'on les as tous
		// on regarde les ficheir qu'il y a dedans
		// mais sinon on fait le sdeux en même temps

		var fileNames = this.getFileNames(path), i = 0, j = fileNames.length, fileName, filePath;
		var moduleTests = [], isModule, modulePath, isDirectory;

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
						if( this.warnAboutFolderWithModuleSignature ){
							console.log(filePath, 'has a module signature but does not provide modules');
						}						
					}

					this.addModuleTests(modulePath, moduleTests);
				}

				moduleTests = moduleTests.concat(this.collect(filePath, isModule));
			}
			else if( !ignoreFile ){
				this.addModuleTests(filePath, moduleTests);
			}
		}

		return moduleTests;
	}
};

module.exports = TestCollector;