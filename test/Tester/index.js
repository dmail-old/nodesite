/*

Réfléchir cette structure qui est zarb puisque

Testserie, testgroup et tester vont tous les trois faire des trucs les uns après les autres
Ptet qu'une sorte de truc commun peut être appliqué
Précisons que test attends actuellement que toutes les assertions se fassent mais on pourrait set
en option de s'arréter à la première erreur comme font testSerie, testGroup etc
en gros Tester run TestGroup run TestSerie run Test run Assertion
donc on regroupe tout ces trucs dans une architecture commune
TestNode qui peut avoir un parent
qui peut exécute une liste de chose
s'arréter ou non quand une échoue

bien définir tout ça sur du papier et en dehors de tout ceci pour que ce soit clair

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
var CheckList = require('CheckList');

var Tester = {
	TestSuite: require('TestSuite'),
	TestCollector: require('TestCollector'),
	Watcher: require('../../node_modules/watcher'),
	emitter: new EventEmitter(),
	fileSystem: require('fs'),

	emit: function(event){		
		
	},

	createTest: function(name, fn){
		return util.new(this.Test, name, fn);
	},

	createSerie: function(name, tests){
		return util.new(this.TestSerie, name, tests);
	},

	createGroup: function(name, series){
		return util.new(this.TestGroup, name, series);
	},

	collectTestsFromObject: function(object){
		var tests = [], key;

		for(key in object){
			tests.push(this.createTest(key, object[key]));
		}

		return tests;
	},

	collectSeriesFromPath: function(path){
		var series = [];
	},

	createGroupFromPath: function(path){
		var series = this.collectSeriesFromPath(path);
		var group = this.createGroup(path, series);
		return group;
	},

	onModuleChange: function(group){
		group.run();
	},

	collectGroupsFromPath: function(path){
		var modulePaths = this.collectModules(path);
		var i = 0, j = modulePaths.length;
		var groups = [], group, modulePath;

		for(;i<j;i++){
			modulePath = modulePaths[i];
			group = this.createGroupFromPath(modulePath);
			groups.push(group);
			
			// relancer tout les tests pour ce module
			this.Watcher.watch(modulePath, this.onModuleChange.bind(this, group));
		}

		return groups;
	},

	runGroup: function(group){

	},

	nextGroup: function(){

	},

	run: function(path){
		this.emit('start');

		var groups = this.collectGroupsFromPath(path);

		// bon faut écouter comment ça se pase dans chaque group etc
	}
};

util.extend(CheckList, Tester);

module.exports = Tester;