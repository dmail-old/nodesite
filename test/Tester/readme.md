Tester
=============

Unit testing for node.js

## Example

```javascript
// setup
var array = ['a', 'b', 'c'];
var iterate = module.iterate;

// testing
it('call fn on every element of the array', function(test){
	var calls = [];
		
	iterate(array,  function(value){
		calls.push(value);
	});

	test.equal(calls.join(''), 'abc');
	test.done();
});

it('get the index as second argument', function(test){
	var calls = [];

	iterate(array, function(value, index){
		calls.push(index);
	});

	test.equal(calls.join(''), '012');
	test.done();
});

it('correctly set the function context as third argument', function(test){
	var context;
	
	iterate(array, function(value){
		context = this;
	}, 'yo');

	test.equal(context, 'yo');
	test.done();
});
```

## File struture for your unit tests

Unit tests are in a 'test' folder in the module folder. Example with a 'foo' module :

```
foo/
	index.js
	test/
		test.js
```

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
module.database = db;

it('must find a user named damien and capitalize its name', function(test){
	module.getUserNameFromDatabaseAndCapitalize('damien', function(error, user){
		test.ok(!error);
		test.equal(user.name, 'DAMIEN');
		test.done();
	});
});

```

## Auto test restart

Changing any module file, test files included, while your tests are running will relaunch tests for this module.

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
