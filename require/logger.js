var inspect = require('./inspect.js');

String.prototype.repeat = function(times){
	var motif = this, output = '';
	while(times--){
		output+= motif;
	}
	return output;
};

String.defineType('info', {color: 'green'});
String.defineType('help', {color: 'cyan'});
String.defineType('warn', {color: 'yellow', font: 'bold'});
String.defineType('debug', {color: 'grey', font: 'bold'});
String.defineType('error', {color: 'red', font: 'bold'});

// https://github.com/visionmedia/callsite/blob/master/lib/__stack.js
Object.defineProperty(global, '__stack', {
	get: function(){
		var orig = Error.prepareStackTrace;
		Error.prepareStackTrace = function(_, stack){ return stack; };
		var err = new Error;
		Error.captureStackTrace(err, arguments.callee);
		var stack = err.stack;
		Error.prepareStackTrace = orig;
		return stack;
	}
});

var Logger = {
	level: 'info',
	levels: ['info','debug','warn','error'],
	colorize: true,
	// object trop complexe pour être affiché
	complexLength: 2000,
	// objet trop profond pour être affiché
	depth: 3,
	// nombre de caractères pouvant tenir sur une ligne
	maxChars: 80,
	
	canLog: function(level){
		return this.levels.indexOf(level) >= this.levels.indexOf(this.level);
	},
	
	getPrefix: function(level){
		if( this.colorize ) return String.setType(level, level) + ': ';
		return level + ': ';
	},
	
	log: function(level, message){
		if( this.canLog(level) ){
			// try catch sur le stringify
			if( typeof message !== 'string' ) message = JSON.stringify(message);			
			console.log(this.getPrefix(level) +  message);
		}
	},
	
	info: function(message){
		return this.log('info', message);
	},
	
	// https://github.com/visionmedia/better-assert/blob/master/lib/better-assert.js
	debug: function(data){
		if( !this.canLog('debug') ) return;
		
		var 
			call = __stack[1],
			file = call.getFileName(),
			lineno = call.getLineNumber(),
			src = FS.readFileSync(file, 'utf8'),
			line = src.split('\n')[lineno-1],
			src = line.replace(/\n|\r/,'')
		;
		
		var prefix = this.getPrefix('debug');
		var result = inspect(data, false, this.depth, this.colorize);
		
		result = result.replace(/\n|\r/g, function(match){ return match + prefix; });
		
		var message = prefix +'\n' + prefix + src + ' (' + file + ':' + lineno + ')\n' + prefix + result + '\n' + prefix;
		
		return console.log(message);
	},
	
	warn: function(message){
		return this.log('warn', message);
	},
	
	error: function(message){
		return this.log('error', message instanceof Error ? message.stack : message);
	}
};

module.exports = Logger;