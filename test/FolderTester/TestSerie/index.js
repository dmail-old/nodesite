/*

Lorsque testGroup échoue il émet qu'il échoue mais je ne fais rien dans ce cas
Alors que cela équivaut à l'échec de TestSerie
Lorsqu'il réussit en revanche il faut vérif qu'on distingue bien qu'un testRéussit d'un TestSerie qui réussit
Tout ça n'est pas clair franchement y'a encore du progrès à faire

*/

var util = require('../util');
var TestModel = require('../TestModel');

var TestSerie = util.extend(TestModel, {
	Test: require('../Test'),
	TestGroup: require('../TestGroup'),
	type: 'testSerie',
	name: 'Anonymous testSerie',	
	moduleTester: null,
	module: null,
	imports: null,
	testGroup: null,

	init: function(path, moduleTester){
		this.path = path;
		this.moduleTester = moduleTester;
		this.module = this.moduleTester.module;
		this.imports = this.moduleTester.imports;
	},

	createTest: function(name, test){
		return util.new(this.Test, name, test, this);
	},

	createTestsFromObject: function(object){
		var tests = [], key;

		for(key in object){
			tests.push(this.createTest(key, object[key]));
		}

		return tests;
	},

	createTestGroup: function(tests){
		return util.new(this.Test, this.name, tests);
	},

	setup: function(){
		global.imports = this.imports;
		// create tests from module.exports
		this.tests = this.createTestsFromObject(require(this.path));
		this.testGroup = this.createTestGroup(this.tests);
		this.testGroup.handler = this;
	},

	teardown: function(){
		global.imports = null;
		delete require.cache[this.path];
	},

	clear: function(){
		this.testGroup.close();
		this.testGroup = null;
	},

	test: function(){
		return this.testGroup.begin();
	}	
});

module.exports = TestSerie;