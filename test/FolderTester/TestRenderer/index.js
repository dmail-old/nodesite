var format = require('util').format;

var TestRenderer = {
	ongroupstart: function(){
		
	},

	ongroupend: function(){
		
	},

	onseriestart: function(serie){
		var message;

		message = 'TESTSUITE %s %d tests to run';
		message = format(message, serie.name, serie.tests.length);

		console.log(message);	
	},

	onserieend: function(serie){
		var message;

		if( serie.tests.length === 0 ){
			message = 'nothing to test';
		}
		else if( serie.current.failedAssertions ){
			message = 'FAILED (%d)';
			message = format(message, serie.duration);
		}
		else{
			message = 'PASSED (%d), {%d} tests';
			message = format(message, serie.duration, serie.tests.length);
		}

		console.log(message);
	},

	// before a test is run
	onteststart: function(test){
		var message = test.name;

		// avoid console.log \n
		process.stdout.write(message);
	},

	// after a test is run
	ontestend: function(test){
		var message;

		if( test.error ){
			message = 'ERRROR (%d ms), %s';
			message = format(message, test.duration, test.error);
		}
		if( test.failedAssertions ){
			// https://github.com/caolan/nodeunit/blob/master/lib/reporters/default.js#L82
			message = '✖ (%d ms), %d/%d assertions \n %s';
			message = format(message, test.duration, test.failedAssertions, test.assertions.length, test.assertions);
			/*TODO test.assertions devrait être formatté*/
		}
		else{
			message = '✔ (%d ms), %d/%d assertions';
			message = format(message, test.duration, test.assertions.length);
		}

		console.log(message);

		if( test.testSuite.watchFile ){
			if( test.error || test.failedAssertions ){
				console.log('waiting for file change to rerun tests');
			}
		}
	}	
};

module.exports = TestRenderer;
