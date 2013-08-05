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

Array.implement('sortWithMoves', function(comparer){
	var array = this, i = 0, j = array.length, pairs = [], pair, index, moves = [];

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
		index = pair[0];
		if( index != i ){
			moves.push(index, i);
		}
		array[i] = pair[1];
	}

	return moves;
});
