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

// keep function through JSON format JSON.parse(json, Function.reviver);
Function.reviver = function(key, value){
	return typeof value == 'string' && value.indexOf('(function ') === 0 ? eval(value) : value;
};

// JSON.stringify(object, Function.replacer);
Function.replacer = function(key, value){
	return typeof value == 'function' ? '(' + String(value) + ')' : value;
};

Function.complement({
	toSource: function(){
		return '(' + this.toString() + ')';
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

	// allow to prefill that execution of a function with x arguments
	curry: function(){
		var self = this, args = Array.slice(arguments);
		return function(){
			// if arguments needs to be added, add them after prefilled arguments, else use directly prefilled arguments
			return self.apply(this, arguments.length ? [].concat(args).concat(Array.slice(arguments)) : args);
		};
	}
});

// from prototype library
Function.argumentNames = function(fn){
    var names = fn.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
      .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
      .replace(/\s+/g, '').split(',');
    return names.length == 1 && !names[0] ? [] : names;
};

Function.implement('overloadSetter', function(usePlural){
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
});
