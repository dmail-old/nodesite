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

var ansi = require('ansi');
appTester.listener = {
	'appTester-startSerie': function(){
		// starting to tests all module found
		console.log(this.serie.length, 'module to test');
	},

	'testSerie-change': function(e){
		// a test file has been modified
		console.log('test file', e.target.path, 'modified, test restarting');
	},

	'moduleTester-change': function(e){
		// a module file has been modified
		console.log('module', e.target.path, 'modified, module tests restarting');
	},
	
	'test-end': function(e){

	},

	'appTester-end': function(){
		// all modules have been tested
		// sauf que bah quand je rerun un module j'arrive pas ici puisque voilà

		if( this.failedCount ){
			var module = this.current;
			var testSerie = module.current;
			var lastTest = testSerie.current;

			var tests = testSerie.serie, test;
			
			var i = 0, j = tests.length;

			console.log(ansi.bold(ansi.red('✖ ' + testSerie.path)));

			var message = '';

			for(;i<j;i++){
				test = tests[i];

				message+= '    ';
				if( test.failed ){
					message+= ansi.red('✖ ' + test.name);
					break;
				}
				else{
					message+= ansi.grey('✔ ' + test.name);
				}
			}

			console.log(message);

			if( lastTest.lastError ){
				console.log('\n', ansi.grey(lastTest.lastError.stack), '\n');
			}
			else if( lastTest.failed ){
				console.log(lastTest.assertions);
			}		
			
			console.log('waiting for file or module change to restart');
		}
		else{
			console.log('✔ ', this.serie.length, 'test passed', this.duration);
		}
	}
};

appTester.start();