/*

TODO: how to inject dependencies? (for now dependencies will be simulated in the top of the tests)

// a simulated database
var database = {
	find: function(selector, callback){
		process.nextTick(function(){
			callback({name: 'damien'})
		})
	}
}

*/

var TestSuite = require('TestSuite');
var Renderer = require('TestRenderer');
var TestCollector = require('TestCollector');
var Watcher = require('../../node_modules/watcher');

var moduleFilePath; // chemin vers le module à tester 
var module; // le module
var moduleTestDirectoryPath; // chemin vers les tests de ce module 
// https://github.com/caolan/nodeunit/blob/master/lib/utils.js#L58
var testFilePaths; // tableau de chemin vers des fichier de tests

// on peut avoir soit un fichier soit un dossier, on privilégie le fichier puis le dossier
// du coup le testCollector ne sers qu'à collecter des test
// ici on va écrire un collecteur qui crée testGroup et testSerie depuis les fichiers qu'il trouve

Watcher.watch(moduleFilePath, function(){
	// relancer tout les tests pour ce module
});

testFilePaths.forEach(function(testFilePath){
	// testCollector éxécuter le fichier testFile en lui passant module
	// qui est le module à tester et it() pour déclarer des tests
	var testFile;

	// get tests from module.exports function
	// https://github.com/caolan/nodeunit/blob/master/lib/utils.js#L107
	var tests = TestCollector.collect(module.exports);
	// create a testsuite object
	var suite = TestSuite.new('Array.iterate', tests, Renderer);

	// run tests
	suite.run();
});


module.exports = exports;