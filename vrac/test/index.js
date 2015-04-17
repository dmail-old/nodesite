var path = require('path');
var fs = require('fs');

function createTest(){
	var test = {
		assert: function(promise){
			promise.then(function(){
				//console.log('assertion passed');
			}).catch(function(error){
				console.error(error);
			});
		},
		
		equal: function(a, b){
			this.assert(Promise.resolve().then(function(){
				if( a != b ){
					throw new Error(a + ' not equal to ' + b);
				}
			}));		
		},

		willResolve: function(a){
			this.assert(Promise.resolve(a));
		},

		resolveTo: function(a, b){
			this.assert(Promise.resolve(a).then(function(value){
				if( value != b ){
					throw new Error('thenable expected to resolve to '+ b + ' but got ' + value);
				}
			}));
		},

		resolveIn: function(a, expectedDuration){
			var precision = expectedDuration * 0.3 + 5;
			var start = new Date();

			this.assert(Promise.resolve(a).then(function(){
				var duration = new Date() - start;
				var diff = duration - expectedDuration;

				if( Math.abs(diff) > precision ){
					var error = new Error();

					if( duration > expectedDuration ){
						error.message =  'resolving took much time than expected (+' + diff  + 'ms)';
					}
					else{
						error.message = 'resolving took less time than expected (-' + -diff  + 'ms)';
					}

					throw error;
				}
			}));
		},

		remainPending: function(a){
			this.assert(Promise.race([
				new Promise(function(resolve, reject){
					setTimeout(resolve, 10);
				}),
				Promise.resolve(a).then(function(){
					throw new Error('thenable supposed to remainPending has resolved');
					
				})
			]));
		}
	};

	return test;
}

function runTests(moduleName){
	var cwd = process.cwd();
	var modulePath = require.resolve(moduleName);
	var module = require(modulePath);
	var testPath = path.dirname(modulePath) + '/' + path.basename(modulePath, path.extname(modulePath)) + '.test.js';
	var testModule = require(testPath);
	var test = createTest();

	Object.keys(testModule).map(function(name){
		console.log('testing', name);
		testModule[name](test, module);
	});
}

module.exports = runTests;

if( require.main === module ){
	process.on('uncaughtException', function(error){
		console.error(error);
	});

	runTests(process.argv[2]);
}