Function.implement = Object.implement.bind(Function);
Function.complement = Object.complement.bind(Function);

Function.EMPTY = function(){ };
Function.TRUE = function(){ return true; };
Function.FALSE = function(){ return false; };
Function.NULL = function(){ return null; };
Function.ZERO = function(){ return 0; };
Function.THIS = function(){ return this; };
Function.RETURN = function(a){ return a; };
Function.IMPLEMENT = function(){ throw new Error('unimplemented'); };

Function.UPPERCASE = function(a){ return a.toUpperCase(); };
Function.ESCAPE = function(a){ return '\\' + a; };

// keep function through JSON format JSON.parse(json, Function.reviver);
Function.reviver = function(key, value){
	return typeof value == 'string' && value.indexOf('(function ') === 0 ? eval(value) : value;
};

// JSON.stringify(object, Function.replacer);
Function.replacer = function(key, value){
	return typeof value == 'function' ? '(' + String(value) + ')' : value;
};

// from http://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically-from-javascript
RegExp.ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
RegExp.COMMA = /,/;
RegExp.ARG = /^\s*(_?)(.+?)\1\s*$/;
RegExp.COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

Function.argumentNames = function(fn){

	var source, declaration, args, i, j, names;

	if( 'argumentNames' in fn ){
		names = fn.argumentNames;
	}
	else{
		names = [];
		source = fn.toString().replace(RegExp.COMMENTS, String.EMPTY);
		declaration = source.match(RegExp.ARGS);

		args = declaration[1];
		if( args ){
			args = args.split(RegExp.COMMA);
			i = 0;
			j = args.length;

			for(;i<j;i++){
				args[i].replace(RegExp.ARG, function(all, underscore, name){
					names.push(name);
				});
			}
		}

		fn.argumentNames = names;
	}

	return names;
};

Function.complement({
	// allow to prefill that execution of a function with x arguments
	curry: function(){
		var self = this, args = Array.slice(arguments);
		return function(){
			// if arguments needs to be added, add them after prefilled arguments, else use directly prefilled arguments
			return self.apply(this, arguments.length ? [].concat(args, Array.slice(arguments)) : args);
		};
	},

	overloadGetter: function(usePlural){
		var self = this;
		return function(a){
			var args, result;
			if (typeof a != 'string') args = a;
			else if (arguments.length > 1) args = arguments;
			else if (usePlural) args = [a];
			if (args){
				result = {};
				for (var i = 0; i < args.length; i++) result[args[i]] = self.call(this, args[i]);
			} else {
				result = self.call(this, a);
			}
			return result;
		};
	},

	overloadSetter: function(usePlural){
		var self = this;
		return function(a, b){
			if( a == null ) return this;
			if( usePlural || typeof a != 'string' ){
				for( var k in a ) self.call(this, k, a[k]);
			}
			else{
				self.call(this, a, b);
			}

			return this;
		};
	}
});
