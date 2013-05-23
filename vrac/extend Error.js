/*
var DBError = new Class(Error, {
	initialize: function(message){
		Error.call(this);
		Error.captureStackTrace(this, arguments.callee);
		this.message = message;
		this.name = 'DBError';
	}
});

var CastError = new Class(DBError, {
	initialize: function(type, value){
		DBError.prototype.initialize.call(this, 'Cast to ' + type + ' failed for value "' + value + '"');
		Error.captureStackTrace(this, arguments.callee);
		this.name = 'CastError';
		this.type = type;
		this.value = value;
	}
});

*/