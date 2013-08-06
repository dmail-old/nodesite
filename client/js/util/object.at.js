/*

name: Object.At

description: Follow a path (often a string) supposed to conduct to a value into an object

provides: Object.examine, Object.follow, Object.setAt, Object.getAt, Object.applyAt, Object.callAt

*/

RegExp.ALPHANUMDOT = /^[\w\.]*$/;

Object.append(Object, {
	cache: {},
	examine: function(path){
		var cache = Object.cache, route;

		if( path in cache ){
			route = cache[path];
		}
		else{
			// if path contains only alphanumeric chars (0-9,a-z,_)
			if( RegExp.ALPHANUM.test(path) ){
				route = path;
			}
			// the path has the form 'name1.name2.name3'
			else if( RegExp.ALPHANUMDOT.test(path) ){
				route = path.split('.');
			}
			// the path contains something else than alphanum or '.'
			// we assume the path contains function call
			else{
				var body = 'return object';

				body+= path.chartAt(0) == '[' ? path : '.' + path;
				body+= ';';

				route = new Function('object', body);
			}

			cache[path] = route;
		}

		return route;
	},

	follow: function(object, path){
		switch(typeof path){
		case 'string':
			return object.get ? object.get(path) : object[path];
		case 'object':
			if( object == null ) return undefined;

			var i = 0, j = path.length, part;
			for(;i<j;i++){
				part = path[i];
				if( part in object ) object = Object.follow(object, part);
				else return undefined;
			}
			return object;
		case 'function':
			return path(object);
		default:
			return undefined;
		}
	},

	setAt: function(object, path, value){
		path = Object.examine(path);

		switch(typeof path){
		case 'string':
			object[path] = value;
			break;
		case 'object':
			var source = object, i = 0, j = path.length, key;

			for(;i<j;i++){
				key = path[i];

				if( i == j - 1 ){
					object[key] = value;
				}
				else{
					if( !Object.prototype.hasOwnProperty.call(object, key) ) object[key] = {};
					object = object[key];
				}
			}

			object = source;
			break;
		}

		return object;
	},

	getAt: function(object, path){
		return Object.follow(object, Object.examine(path));
	},

	applyAt: function(object, path, bind, args){
		var fn = Object.getAt(object, path);
		return typeof fn == 'function' ? fn.apply(bind, args) : undefined;
	},

	callAt: function(object, path, bind){
		return Object.applyAt(object, path, bind, Array.slice(arguments, 3));
	}
});

/**

Replace {.*?} into a string by key/value of object

*/

RegExp.BRACLET = /\\?\{([\w.]+)\}/g;

String.implement('parse', function(object){
	return String(this).replace(RegExp.BRACLET, function(match, path){
		if( match.charAt(0) == '\\' ) return match.slice(1);
		var value = Object.getAt(object, path);
		return value != null ? value : '';
	});
});

/**

Sort an array towards the properties of object he contains

orderBy('name');
orderBy('name');
orderBy('name', 'index', -1, function(a){ return a.name.toLowerCase(); }, 'getCount()');

*/

Array.getComparer = function(){
	var i, n, j = arguments.length, fns = [], orders = [], arg;

	i = n = 0;

	for(;i<j;i++){
		arg = arguments[i];
		switch(typeof arg){
		case 'string':
			arg = function(path, item){ return Object.follow(item, path); }.curry(Object.examine(arg));
		case 'function':
			fns[n++] = arg;
			break;
		case 'number':
			if( n ) orders[n-1] = arg;
			break;
		}
	}

	function compare(a,b){
		var calc, va, vb;
		for(i=0;i<n;i++){
			calc = fns[i];
			va = calc.call(a, a);
			vb = calc.call(b, b);

			if( va > vb ) return orders[i] || 1;
			if( va < vb ) return -(orders[i] || 1);
		}
		return 0;
	}

	return compare;
};

Array.implement('orderBy', function(){
	return this.sort(Array.getComparer.apply(Array, arguments));
});

Function.COMPARE = function(a, b){ return a < b ? -1 : a > b ? 1 : 0; };

Array.implement('getInsertionOrderIndex', function(item, compare){
	var i = 0, j = this.length;

	if( compare == null ) compare = Function.COMPARE;

	for(;i<j;i++){
		if( compare(item, this[i]) === -1 ){
			return i;
		}
	}

	return j;
});

// permet d'insérer item dans this en respectant l'ordre imposé par compare
Array.implement('insertSort', function(item, compare){
	this.splice(this.getInsertionOrderIndex(item, compare), 0, item);
	return this;
});

Array.implement('sortWithAffectations', function(comparer){
	var array = this, i = 0, j = array.length, pairs = [], pair, affectations = [];

	for(;i<j;i++){
		pairs[i] = [i, array[i]];
	}

	if( typeof comparer != 'function' ) comparer = Function.COMPARE;

	pairs.sort(function(a, b){
		return comparer.call(array, a[1], b[1]);
	});

	i = 0;
	for(;i<j;i++){
		pair = pairs[i];
		affectations.push(pair[0], i);
		array[i] = pair[1];
	}

	return affectations;
});

Array.implement('shuffle', function(){
	var i = this.length - 1, j, temp;

	while( i > 0 ){
		j = Math.floor(Math.random() * (i + 1));
		temp = this[i];
		this[i] = this[j];
		this[j] = temp;
		i--;
	}

	return this;
});

Array.implement('move', function(from, to){
	if( from != to ){
		var value = this[from];
		this.splice(from, 1);
		// put at the new index
		this.splice(to, 0, value);
	}
	return this;
});

/*

	"affectation" refers to:
		assigning 0 at 1 in ['a', 'b', 'c'] gives -> ['a', 'a', 'c']
	"move" refers to:
		moving 0 at 1 in ['a', 'b', 'c'] gives -> ['b', 'a', 'c']

	Take an array of index affectations
	[oldIndex, newIndex, ...]
	and returns a list of moves
	[oldIndex, newIndex, ...]
	to perform to get the same result as affectations list

*/
function transformAffectationsToMoves(affectations){
	var i = 0, j = affectations.length, oldIndex, index;
	var from, to, gap, trace = [], traceIndex, loopTrace;
	var moves = [];

	for(;i<j;i+=2){
		oldIndex = affectations[i];
		if( typeof trace[oldIndex] === 'number' ){
			oldIndex = trace[oldIndex];
		}
		index = affectations[i + 1];

		if( oldIndex == index ){
			// no moved needed affectations made this move useless
		}
		else{
			moves.push(oldIndex, index);

			// the value is moved to the left ir the right of it's current index
			if( index < oldIndex ){
				gap = 1;
			}
			else{
				gap = -1;
			}

			loopTrace = [];

			from = oldIndex;
			to = index;
			if( typeof trace[from] == 'number' ){
				traceIndex = trace.indexOf(from);
				if( traceIndex > -1 ){
					from = traceIndex;
				}
			}
			loopTrace.push(from, to);
			//console.log(oldIndex, 'becomes', index, loopTrace);

			while(index != oldIndex){
				from = index;
				to = index + gap;
				if( typeof trace[from] == 'number' ){
					traceIndex = trace.indexOf(from);
					if( traceIndex > -1 ){
						from = traceIndex;
					}
				}
				loopTrace.push(from, to);
				//console.log(index, 'becomes', index+gap, loopTrace);

				index+= gap;
			}

			var k = 0, l = loopTrace.length;
			for(;k<l;k+=2){
				trace[loopTrace[k]] = loopTrace[k+1];
			}

			//console.log('move', value, 'from', oldIndex, 'to', affectations[i + 1]);
			//console.log('result', array);
			//console.log('trace', trace);
		}
	}

	return moves;
}
