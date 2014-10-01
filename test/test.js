/*

Ici on est reponsable de lancer des tests et de log tout ça dans la console

On acccept une liste de fichier à tester
Cette liste proviendra d'une analyse de tous les modules contenant un dossier "test" dans le dossier admin

Ceci doit être indépendant de tout autre module
Ceci peut très bien être lancé par admin.js comme processus au démarrage du serveur

*/

process.on('uncaughtException', function(e){
	console.log('\n', e.stack, '\n');
	require('fs').appendFileSync('./error.log', e.stack + '\n');
});

setTimeout(function(){}, 1000 * 60 * 10);

var AppTester = require('./AppTester');
var path = require('path');
var appPath = path.normalize(process.argv[2]);

appPath = path.resolve(process.cwd(), appPath);

var appTester = AppTester.new(appPath);

appTester.listener = {
	'appTester-beginSerie': function(){
		// starting to tests all module found
		//console.log(this.serie);
	},

	'testSerie-change': function(){
		// a test file has been modified
	},

	'moduleTester-change': function(){
		// a module file has been modified
	},
	
	'test-fail': function(){
		// a test has failed (by error or assertion)
	},

	'appTester-end': function(){
		// all modules have been tested
	}
};

appTester.begin();