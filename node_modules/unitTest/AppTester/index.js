/*

*/

var util = require('./util');
var TestSerie = require('./TestSerie');

var AppTester = util.extend(TestSerie, {
	type: 'appTester',
	ModuleCollector: require('./ModuleCollector'),
	ModuleTestCollector: require('./ModuleTestCollector'),
	ModuleTester: require('./ModuleTester'),
	fileSystem: require('fs'),
	isWatching: false,
	listener: null,

	new: function(path){
		return util.new(this, path);
	},

	init: function(path){
		this.path = path;
	},

	handleEvent: function(e){
		TestSerie.handleEvent.call(this, e);

		console.log(e.type);

		if( this.listener && this.listener[e.type] ){
			this.listener[e.type].call(this, e);
		}
	},

	createTest: function(moduleTester){
		return moduleTester;
	},

	createModuleTester: function(path, testPaths){
		return util.new(this.ModuleTester, path, testPaths);
	},

	moduleTesterComparer: function(moduleA, moduleB){
		return moduleA.level - moduleB.level;
		//return moduleA.getDependencyLevel() - moduleB.getDependencyLevel();
	},

	setupSerie: function(){},
	tearDownSerie: function(){},

	getSerie: function(){
		var badSignature = [];

		this.ModuleCollector.badSignature = badSignature;

		var modulePaths = this.ModuleCollector.collect(this.path);
		
		if( badSignature && badSignature.length ){
			badSignature = badSignature.filter(this.ModuleTestCollector.filterFolder, this.ModuleTestCollector);
			if( badSignature.length ){
				console.log('the following folder are not module but have a module signature : \n',
					badSignature, '\n');
			}
		}

		var i = 0, j = modulePaths.length, modulePath, testPaths, moduleTester;
		var serie = [];

		for(;i<j;i++){
			modulePath = modulePaths[i];
			testPaths = this.ModuleTestCollector.collect(modulePath);
			if( testPaths.length ){
				moduleTester = this.createModuleTester(modulePath, testPaths);
				serie.push(moduleTester);
			}
		}

		return serie.sort(this.moduleTesterComparer);
	}
});

module.exports = AppTester;