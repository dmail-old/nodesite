var FS = require('fs');
var Path = require('path');

// var myError = function(message){
	// Error.call(this);
	// Error.captureStackTrace(this, myError);
	// this.message = message;
// };
// Object.setPrototype(myError, Error);

// laisse la console visible au moins 10 seconde
setTimeout(function(){
	
}, 10000);

Error.prepareStackTrace = function(error, stack){ return stack; };

function getLine(file, line){
	var content = FS.readFileSync(file, 'utf8').split('\n')[line-1];
	
	if( content ){
		return content.substr(0, content.length-1).replace(/^\s+/g, '');
	}
	return null;
}

function backTrace(stack){
	return stack.map(function(frame){
		return {
			file: frame.getFileName(),
			line: frame.getLineNumber(),
			column: frame.getColumnNumber(),
			func: frame.getFunctionName()
		};
	});
}

function getLineSource(file, line){
	var content = FS.readFileSync(file, 'utf8');
	
	if( content ){
		var source = content.split('\n')[line-1];
		// supprime le \n\r final
		if( source.charAt(source.length-1) == '\n' || source.charAt(source.length-1) == '\r' ) source = source.substr(0, source.length-1);
		return source;
	}
	return null;
}

var util = require('util');

function handle(error, stack){
	var
		date = new Date(),
		day = date.getDay(),
		month = date.getMonth(),
		hours = date.getHours(),
		minutes = date.getMinutes(),
		seconds = date.getSeconds(),
		now
	;
	
	if( day < 10 ) day = '0'+day;
	if( month < 10 ) month = '0'+month;
	if( hours < 10 ) hours = '0'+hours;
	if( minutes < 10 ) minutes = '0'+minutes;
	if( seconds < 10 ) seconds = '0'+seconds;
	
	now = day + '/' + month + ' ' + hours + ':' + minutes + ':' + seconds;
	
	var type = 'Error';
	if( error instanceof ReferenceError ) type = 'ReferenceError';
	else if( error instanceof TypeError ) type = 'TypeError';
	
	var trace = backTrace(error.stack);
	var data = {
		type: type,
		message: error.message,
		date: now
	};
	
	var message = '';
	
	message+= '' + Path.basename(trace[0].file) + ' (line ' + trace[0].line + ')\n';
	
	try{
		data.source = getLineSource(trace[0].file, trace[0].line);
		message+= data.source + '';
		message+= '\n';
		
		var i = 1, j = trace[0].column;
		for(;i<j;i++) message+= ' ';
		message+= '^\n';
	}
	catch(e){
		
	}
	
	data.trace = trace;
	
	message+= '\x1B[1;31m' + type + ':\t' + error.message + '\x1B[0m';
	FS.appendFileSync('error.log', '\n' + JSON.stringify(data));
	
	error.stack = message;
	throw error;
}

process.on('uncaughtException', handle);