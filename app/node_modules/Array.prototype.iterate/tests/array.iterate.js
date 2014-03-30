// this file will be put in app/node_modules/array.prototype.iterate/tests/1.js
// server side all the website tree will be recursively browser searching for nodes_modules/tests/ folder
// the file within thoose folder will be consider as tests to run agains the module

testModule('Array.prototype.iterate/iterate', function(){

	it('call fn on every element of the array', function(){
		var calls = [];
		[0, 1, 2, 3].iterate(function(value){
			calls.push(value);
		});

		expect(calls.join('')).toBe('0123');
	});

	it('get the index as second argument', function(){
		var calls = [];
		['a', 'b', 'c'].iterate(function(value, index){
			calls.push(index);
		}, null, 'prev');

		expect(calls.join('')).toBe('210');
	});

	it('start from a specific index', function(){
		var calls = [];
		['a', 'b', 'c'].iterate(function(value){
			calls.push(value);
		}, null, 'next', 0);

		expect(calls.join('')).toBe('bc');
	});

	it('loop next from a specific index', function(){
		var calls = [];
		['a', 'b', 'c'].iterate(function(value){
			calls.push(value);
		}, null, 'next', 0, true);

		expect(calls.join('')).toBe('bca');
	});

	it('loop prev from a specific index', function(){
		var calls = [];
		['a', 'b', 'c'].iterate(function(value){
			calls.push(value);
		}, null, 'prev', 1, true);

		expect(calls.join('')).toBe('acb');
	});

	it('loop next with a negative start index', function(){
		var calls = [];
		['a', 'b', 'c'].iterate(function(value){
			calls.push(value);
		}, null, 'next', -10, true);

		expect(calls.join('')).toBe('abc');
	});

	it('loop prev with an index > array.length', function(){
		var calls = [];
		['a', 'b', 'c'].iterate(function(value){
			calls.push(value);
		}, null, 'prev', 100, true);

		expect(calls.join('')).toBe('cba');
	});

	it('call fn on every element from an index to an other index', function(){
		var calls = [];
		['a', 'b', 'c', 'd', 'e'].iterate(function(value){
			calls.push(value);
		}, null, 'next', 0, 2);

		expect(calls.join('')).toBe('bc');
	});

	it('call fn on every element from an index to an other index in reverse order', function(){
		var calls = [];
		['a', 'b', 'c', 'd', 'e'].iterate(function(value){
			calls.push(value);
		}, null, 'prev', 2, 0);

		expect(calls.join('')).toBe('ba');
	});

	it('never call fn for next with an index > array.length', function(){
		var calls = [];
		['a', 'b', 'c', 'd', 'e'].iterate(function(value){
			calls.push(value);
		}, null, 'next', 10);

		expect(calls.join('')).toBe('');
	});

	it('never call fn for prev with an index <= 0', function(){
		var calls = [];
		['a', 'b', 'c', 'd', 'e'].iterate(function(value){
			calls.push(value);
		}, null, 'prev', 0);

		expect(calls.join('')).toBe('');
	});

});