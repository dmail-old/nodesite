var types = {
	'all':{
	
	},
	
	'array': {
		is: function(value){
			return typeof value == 'array' || value instanceof Array || Array.isArray(value);
		}
	},
	
	'boolean': {
		is: function(value){
			return typeof value == 'boolean';
		},
		cast: function(value){
			return value === '0' ? false : Boolean(value);
		}
	},
	
	'date':{
		is: function(value){
			return value instanceof Date;
		},
		cast: function(value){
			if( value === null || value === '' ) return Date(value);
			if( value instanceof Date ) return value;

			var date;
			// support for timestamps
			if( typeof value == 'number' || value instanceof Number || String(value) == Number(value) ) date = new Date(Number(value));
			// support for date strings
			else if( value.toString ) date = new Date(value.toString());
			if( date.toString() != 'Invalid Date' ) return date;
			
			throw new TypeError('unable to cast' +value+ ' as a date');
		}
	},
	
	'function':{
		is: function(value){
			return typeof value == 'function' || value instanceof Function;
		}
	},
	
	'number':{
		cast: function(value){
			if( !isNaN(value) ){
				if( value === null || value === '' ) return Number(value);
				if( typeof value == 'string' ) value = Number(value);
				if( value instanceof Number ) return value;
				if( typeof value == 'number' ) return value;
				if( value.toString && !Array.isArray(value) && value.toString() == Number(value) ) return new Number(value);
			}
			
			throw new TypeError('unable to cast' +value+ ' as a number');
		}
	},
	
	'object':{
		is: function(value){
			return typeof value == 'object';
		}
	},
	
	'regexp':{
		is: function(value){
			return value instanceof Regexp;
		}
	},
	
	'string':{
		is: function(value){
			return typeof value == 'string' || value instanceof String;
		},
		cast: function(value){
			if( value === null ) return String(value);
			if( typeof value !== 'undefined' && value.toString ) return value.toString();
			
			throw new TypeError('unable to cast' +value+ ' as a string');
		}
	}
};

// types.timestamp = types.number;

Object.cast = function(source, type){
	type = types[type];
	if( !type || !type.cast ) throw new TypeError('unable to cast' +value+ ' as '+type);
	else return type.cast(source);
};

Object.is = function(source, type){
	type = types[type];
	return type && type.is ? type.is(source) : true;
};