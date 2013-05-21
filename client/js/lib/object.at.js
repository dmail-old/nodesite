/*

name: Object.At

description: Follow a path (often a string) supposed to conduct to a value into an object

provides: Object.examine, Object.follow, Object.setAt, Object.getAt, Object.applyAt, Object.callAt

*/

(function(){

var cache = {}, hasOwnProperty = Object.prototype.hasOwnProperty;

Object.append(Object, {
	examine: function(path){
		if( !path.match ) console.trace(path);
		
		var cached = cache[path];
		if( cached ) return cached;
		// if path contains nothing else than '_' or alphanumeric chars
		if( !path.match(/\W/) ) return cache[path] = path;
		// if path contains anyting else than '_', '.' or alphanumeric chars we assume the path contains function call
		if( path.match(/[^\w\.]/) ) return cache[path] = new Function('object', 'return object'+(path.charAt(0) != '[' ? '.'+path : path)+';');
		// else the path has the form 'name1.name2.name3'
		return cache[path] = path.split('.');
	},
	
	follow: function(object, path){
		if( object == null ) return undefined;
		
		switch(typeof path){
			case 'string':
				return object.get ? object.get(path) : object[path];
			case 'object':
				var i = 0, j = path.length;
				for(;i<j;i++){
					if( !hasOwnProperty.call(object, path[i]) ) return undefined;
					object = Object.follow(object, path[i]);
				}
				return object;
			case 'function': return path(object);
			default: return undefined;
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
						if( !hasOwnProperty.call(object, key) ) object[key] = {};
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

})();

/**

Replace {.*?} into a string by key/value of object

*/

String.prototype.parse = function(object){
	return String(this).replace(/\\?\{([\w.]+)\}/g, function(match, path){
		if( match.charAt(0) == '\\' ) return match.slice(1);
		var value = Object.getAt(object, path);
		return value != null ? value : '';
	});
};

/**

Sort an array towards the properties of object he contains

orderBy('name');
orderBy('name');
orderBy('name', 'index', -1, function(a){ return a.name.toLowerCase(); }, 'getCount()');

*/

Array.prototype.orderBy = function(){
	var i = n = 0, j = arguments.length, fns = [], orders = [], arg;
	
	for(;i<j;i++){
		arg = arguments[i];
		switch(typeof arg){
			case 'string': arg = function(path, item){ return Object.follow(item, path); }.curry(Object.examine(arg));
			case 'function': fns[n++] = arg; break;
			case 'number': if( n ) orders[n-1] = arg; break;
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
	};
	
	return this.sort(compare);
};