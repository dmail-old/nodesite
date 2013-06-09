// arguments to array
window.toArray = function(item, start, end){
	if( !start && typeof end != 'number' ) return Array.apply(null, item);	
	return Array.prototype.slice.call(item, start, end);
};

Function.EMPTY = function(){ };
Function.TRUE = function(){ return true; };
Function.FALSE = function(){ return false; };
Function.THIS = function(){ return this; };
Function.NULL = function(){ return null; };
Function.ZERO = function(){ return 0; };
Function.RETURN = function(a){ return a; };
Function.IMPLEMENT = function(){ throw new Error('method not implemented'); };

// keep function through JSON format JSON.parse(json, Function.reviver);
Function.reviver = function(key, value){
	return typeof value == 'string' && value.indexOf('(function ') === 0 ? eval(value) : value;
};

// JSON.stringify(object, Function.replacer);
Function.replacer = function(key, value){
	return typeof value == 'function' ? '(' + String(value) + ')' : value;
};

RegExp.SPACE = /\s+/;
RegExp.alphanum = /^[a-zA-Z0-9_]*$/;
