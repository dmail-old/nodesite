var format = require('util').format;

var TestRenderer = {
	// when testsuite starts
	onstart: function(suite){
		var message;

		message = 'TESTSUITE %s %d tests to run';
		message = format(message, suite.name, suite.tests.length);

		console.log(message);	
	},

	// when testsuite is over
	onend: function(suite){
		var message;

		if( suite.tests.length === 0 ){
			message = 'nothing to test';
		}
		else if( suite.current.failedAssertions ){
			message = 'FAILED (%d)';
			message = format(message, suite.duration);
		}
		else{
			message = 'PASSED (%d), {%d} tests';
			message = format(message, suite.duration, suite.tests.length);
		}

		console.log(message);
	},

	// before a test is executed
	onteststart: function(test){
		var message = test.name;

		// avoid console.log \n
		process.stdout.write(message);
	},

	// after a test is executed
	ontestend: function(test){
		var message;

		if( test.error ){
			message = 'ERRROR (%d ms), %s';
			message = format(message, test.duration, test.error);
		}
		if( test.failedAssertions ){
			// https://github.com/caolan/nodeunit/blob/master/lib/reporters/default.js#L82
			message = 'FAILED (%d ms), %d/%d assertions failed \n %s';
			message = format(message, test.duration, test.failedAssertions, test.assertions.length, test.assertions);
			/*TODO test.assertions devrait être formatté*/
		}
		else{		
			message = 'PASSED (%d ms), %d assertions passed';
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