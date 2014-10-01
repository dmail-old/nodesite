/*

*/

var util = require('./util');
var TestSerie = require('../TestSerie');

var AppTester = util.extend(TestSerie, {
	type: 'appTester',
	ModuleCollector: require('./ModuleCollector'),
	ModuleTestCollector: require('./ModuleTestCollector'),
	ModuleTester: require('ModuleTester'),
	fileSystem: require('fs'),
	isWatching: false,

	handleEvent: function(e){
		TestSerie.handleEvent.call(this, e);
		
		if( e.type == 'appTester-begin' ){
			// starting to tests all module found
			console.log(this.serie.length, 'module to test');
		}
		else if( e.type == 'testSerie-change' ){
			// a test file has been changed
		}
		else if( e.type == 'moduleTester-change' ){
			// a module file have been changed
		}
		else if( e.type == 'test-fail' ){
			// a test has failed (by error or assertion)
		}
		else if( e.type == 'appTester-end' ){
			// all modules have been tested
		}
	},

	init: function(path){
		this.path = path;
	},

	createTest: function(moduleTester){
		return moduleTester;
	},

	moduleTesterComparer: function(moduleA, moduleB){
		return moduleA.dependencyLevel - moduleB.dependencyLevel;
	},

	getSerie: function(){
		var modulePaths = this.ModuleCollector.collect(this.path);
		var i = 0, j = modules.length, modulePath, testPaths, moduleTester;
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
};

module.exports = AppTester;