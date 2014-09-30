/*

*/

var EventEmitter = require('events').EventEmitter;

var Listener = {
	ongroupstart: function(group){

	},

	onseriestart: function(serie){
		//renderer: require('TestRenderer'),
		//this.renderer['on' + event].apply(this.renderer, Array.prototype.slice.call(arguments, 1));
	}
};

var util = require('./util');

var Tester = {
	ModuleCollector: require('./ModuleCollector'),
	ModuleTestCollector: require('./ModuleTestCollector'),
	ModuleTester: require('ModuleTester'),
	fileSystem: require('fs'),
	listener: Listener,

	createModuleTester: function(path, testPaths){
		return util.new(this.ModuleTester, path, testPaths);
	},

	moduleTesterComparer: function(moduleA, moduleB){
		return moduleA.dependencyLevel - moduleB.dependencyLevel;
	},

	run: function(path){
		var modulePaths = this.ModuleCollector.collect(path);
		var modulePath;
		var i = 0, j = modulePaths.length, moduleTestPaths;
		var moduleTesters = [], moduleTester;

		for(;i<j;i++){
			modulePath = modulePaths[i];
			moduleTestPaths = this.ModuleTestCollector.collect(modulePath);

			if( moduleTestPaths.length ){
				moduleTester = this.createModuleTester(modulePath, moduleTestPaths);
				moduleTesters.push(moduleTester);
			}
		}

		if( moduleTesters.length ){
			console.log(moduleTesters.length, 'module to test');

			moduleTesters = moduleTesters.sort(this.moduleTesterComparer);

			/*
			var checkSerie = this.createCheckSerie(moduleTesters)
			
			checkSerie.onBegin = // checkSerie starting
			checkSerie.onCheckBegin = function(testSerie){ // testSerie is going to begin }
			checkSerie.onCheckFail = function(testSerie){ // testSerie failed }
			checkSerie.onCheckPass = function(testSerie){ // testSerie passed }
			checkSerie.onCheckEnd = function(testSerie){ // testSerie ended }
			checkSerie.onEnd = // checkSerie ended

			*/
		}		
	}
};

module.exports = Tester;