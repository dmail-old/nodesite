Tester
=============

Unit testing for node.js

## Test file example

```javascript
// setup
var array = ['a', 'b', 'c'];
var iterate = imports.iterate;

// testing
exports['call fn on every element of the array'] = function(test){
	var calls = [];
		
	iterate(array,  function(value){
		calls.push(value);
	});

	test.equal(calls.join(''), 'abc');
	test.done();
};

exports['get index as second argument'] function(test){
	var calls = [];

	iterate(array, function(value, index){
		calls.push(index);
	});

	test.equal(calls.join(''), '012');
	test.done();
};

exports['set the third argument as the function context'] = function(test){
	var context;
	
	iterate(array, function(value){
		context = this;
	}, 'yo');

	test.equal(context, 'yo');
	test.done();
};
```

## Imports variable

When you run a test, the module you want ot test is found thanks to your file structure (see below).  
Then it is set to test.module and module.exports is cloned into test.imports also accessible by the `imports` global variable.  

## File struture for your unit tests

Unit tests are located in the module folder.  
You can put the in a unique file like so  :

```
foo/
	index.js
	test.js
```

Or in a test folder like so :

```
foo/
	index.js
	test/
		testgroupA.js
		testgroupB.js
```

## Auto test restart

Changing any module file, test files included, while your tests are running will relaunch tests for this module.

## Dependency management

Resolving dependencies is done in the setup phase.    

```javascript
var db = {
	find: function(selector, callback){
	 	process.nextTick(function(){
	 		callback(null, {name: 'damien'});
	 	})
	}
};
// database depency resolved
imports.database = db;

exports['must find a user named damien and capitalize its name'] = function(test){
	imports.getUserNameFromDatabaseAndCapitalize('damien', function(error, user){
		test.ok(!error);
		test.equal(user.name, 'DAMIEN');
		test.done();
	});
};

```

## Relationship between components

Assertion is the smallest component, example of an assertion : test.equal(a,b)).  
Test is composed by X assertions.  
TestSerie runs X Test and halt when a test fails (1+ assertion failed or an error occured).  
TestGroup runs X TestSerie and halt when a TestSerie fails.  
Tester runs X TestGroup and report how all of this went.

```
Assertion n:1 Test n:1 TestSerie n:1 TestGroup n:1 Tester
```

## Requirements

- Watcher
