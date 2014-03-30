testModule('objectObserver/arrayObserver', function(ArrayObserver){	

	it('should get an add change for push', function(){

		var lastChange = false;
		var array = [];
		var observer = ArrayObserver.new(array, function(change){
			lastChange = change;
		});

		array.push('coucou', 'mec');

		expect(lastChange.type).toBe('add');
		expect(lastChange.value).toBe('mec');
		expect(lastChange.index).toBe(1);
	});

	it('should get a remove change for pop', function(){

		var lastChange = false;
		var array = ['coucou'];
		var observer = ArrayObserver.new(array, function(change){
			lastChange = change;
		});

		array.pop();

		expect(lastChange.type).toBe('remove');
		expect(lastChange.value).toBe('coucou');
		expect(lastChange.index).toBe(0);
	});

	it('should get an update change for an affectation', function(){

		var lastChange = false;
		var array = ['coucou'];
		var observer = ArrayObserver.new(array, function(change){
			lastChange = change;
		});

		array[0] = 'hello';

		expect(lastChange.type).toBe('update');
		expect(lastChange.value).toBe('hello');
		expect(lastChange.oldValue).toBe('coucou');
		expect(lastChange.index).toBe(0);
	});

	it('should not react to affectations out of current length', function(){

		var lastChange = false;
		var array = [];
		var observer = ArrayObserver.new(array, function(change){
			lastChange = change;
		});

		array[1] = 'hello';
		array.length = 100;

		expect(lastChange).toBe(false);
	});

	it('should not react to the delete operator', function(){

		var lastChange = false;
		var array = ['coucou'];
		var observer = ArrayObserver.new(array, function(change){
			lastChange = change;
		});

		delete array[0];

		// the lastChange is add coucou
		expect(lastChange.type).toBe('add');
	});

	it('should perform affectations and get the same result as the source affectations', function(){

		function testAffectations(array){
			var sortCopy = [].concat(array);
			var affectCopy = [].concat(array);
			//var syncCopy = [].concat(array);
			var affectations = ArrayObserver.sortWithAffectations(sortCopy);

			ArrayObserver.array = sortCopy;
			ArrayObserver.performAffectations(affectations, affectCopy);

			if( sortCopy.join('') === affectCopy.join('') ){
				return true;
			}
			else{
				//console.log(affectations);
				//console.log(array, sortCopy, affectCopy);
				return false;
			}
		}

		expect(testAffectations(Array.range('a', 'z').shuffle())).toBe(true);
		expect(testAffectations(Array.range('a', 'z').shuffle())).toBe(true);
		expect(testAffectations(Array.range('a', 'z').shuffle())).toBe(true);

	});

	it('should transform affectations to moves and perform moves and get same result as performing affectations', function(){

		function testMoves(array){
			var sortCopy = [].concat(array);
			var moveCopy = [].concat(array);
			//var syncCopy = [].concat(array);
			var affectations = ArrayObserver.sortWithAffectations(sortCopy);

			// comment je fais pour mon template js moi maintenant?
			var moves = ArrayObserver.transformAffectationsToMoves(affectations);
			var i = 0, j = moves.length;

			for(;i<j;i+=2){
				moveCopy.move(moves[i], moves[i+1]);
			}

			if( sortCopy.join('') === moveCopy.join('') ){
				return true;
			}
			else{
				console.log(affectations);
				console.log(array, sortCopy, moveCopy);
				return false;
			}
		}

		expect(testMoves(Array.range('a', 'z').shuffle())).toBe(true);
		expect(testMoves(Array.range('a', 'z').shuffle())).toBe(true);
		expect(testMoves(Array.range('a', 'z').shuffle())).toBe(true);
	});

	it('should be able to keep array in sync', function(){

		// array stay in sync with the source array
		function syncArray(source, array){

			ArrayObserver.new(source, function(change){
				if( change.type == 'affectations' ){
					ArrayObserver.performAffectations(change.value, array, source);
				}
				else if( change.type == 'add' ){
					array[change.index] = change.value;
				}
				else if( change.type == 'update' ){
					array[change.index] = change.value;
				}
				else if( change.type == 'remove' ){
					array.splice(change.index, 1);
				}
			}, array);

			return array;
		}

		var array = ['a', 'b', 'c'];
		var inSyncArray = syncArray(array, []);

		array.reverse();
		expect(array.join('')).toBe(inSyncArray.join(''));
	});

});