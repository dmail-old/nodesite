/*

name: Object.At

description: Follow a path (often a string) supposed to conduct to a value into an object

provides: Object.examine, Object.follow, Object.setAt, Object.getAt, Object.applyAt, Object.callAt

*/

Object.cache = {};

RegExp.ALPHANUMDOT = /^[\w\.]*$/;

Object.append(Object, {
	examine: function(path){
		if( !path.match ) console.trace(path);

		var cache = Object.cache, cached = cache[path];

		if( cached ){
			return cached;
		}
		// if path contains only alphanumeric chars (0-9,a-z,_)
		if( RegExp.ALPHANUM.test(path) ){
			return cache[path] = path;
		}
		// the path has the form 'name1.name2.name3'
		if( RegExp.ALPHANUMDOT.test(path) ){
			return cache[path] = path.split('.');
		}
		// the path contains somethign else than alphanum or '.' we assume the path contains function call
		return cache[path] = new Function('object', 'return object'+(path.charAt(0) != '[' ? '.' + path : path) + ';');
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
			var source = object;
			var i = 0, j = path.length, key;
			
			for(;i<j;i++){
				key = path[i];
				
				if( i == j-1 ){
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
		return Object.applyAt(object, path, bind, toArray(arguments, 3));
	}
});

/**

Replace {.*?} into a string by key/value of object

*/

String.implement('parse', function(object){
	return String(this).replace(/\\?\{([\w.]+)\}/g, function(match, path){
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

Array.implement('orderBy', function(){
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
	
	return this.sort(compare);
});