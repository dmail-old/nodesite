String.defineType('boolean', {color: 'blue', font: 'bold'});
String.defineType('number', {color: 'red'});
String.defineType('string', {color: 'inherit'});
String.defineType('regexp', {color: 'magenta'});
String.defineType('function', {color: 'cyan'});
String.defineType('null', {color: 'inherit'});
String.defineType('undefined', {color: 'inherit'});

String.defineType('key', {color: 'grey', font: 'bold'});
String.defineType('circular', {color: 'cyan'});
String.defineType('ellipsis', {color: 'cyan'});
String.defineType('deep', {color: 'cyan'});
String.defineType('complex', {color: 'cyan'});

var util = require('util');

var Inspect = new Class({
	multiline: 'auto',
	color: false,
	ellipsis: '[...]',
	deep: '[Deep]',
	circular: '[Circular]',
	complex: '[Complex]',
	tab: '   ',
	newLine: '\n',
	// object trop complexe pour être affiché
	complexLength: 2000,
	// objet trop profond pour être affiché
	maxDepth: 5,
	// nombre de caractères pouvant tenir sur une ligne
	maxChars: 80,

	constructor: function(){
		this.reset();
	},

	reset: function(){
		this.resetLine();
		this.count = 0;
		this.items = [];
	},

	inspect: function(item){
		var result = this.stringify(item);
		this.reset();
		return result;
	},

	stylize: function(string, type){
		string = String(string);

		var linelength = String.removeTypes(this.line).length;
		var strlen = String.removeTypes(string).length;

		if( linelength + strlen + this.ellipsis.length > this.maxChars ){
			string = string.substr(0, this.maxChars - this.ellipsis.length - linelength - 1); // -1 pour la virgule finale
			string+= String.setType(this.ellipsis, 'ellipsis');
		}

		if( this.color ){
			string = String.setType(string, type);
		}

		return string;
	},

	isDeep: function(item){
		return this.count > this.maxDepth;
	},

	isCircular: function(item){
		return this.items.indexOf(item) !== -1;
	},

	calcLineWidth: function(item){
		var inspector = new Inspect();
		inspector.multiline = false;
		inspector.color = false;

		var length = String.removeTypes(this.line).length;
		var str = inspector.inspect(item);

		return length + str.length;
	},

	calcMultiline: function(item){
		return this.calcLineWidth(item) > this.maxChars;
	},

	stringify: function(source){
		if( source === null ) return this.stylize('null', 'null');
		if( source === undefined ) return this.stylize('undefined', 'undefined');

		switch(typeof source){
			case 'boolean': return this.stylize(source, 'boolean');
			case 'number': return this.stylize(source, 'number');
			case 'string': return this.stylize("'"+ source + "'", 'string');
			case 'object': case 'function':
				if( source instanceof RegExp ) return this.stylize(source, 'regexp');
				if( source instanceof Date ) return this.stylize(source, 'date');
				if( source instanceof Function && !Object.keys(source).length ) return this.stylize('[Function]', 'function');

				return this.stringifyObject(source);
			break;
		}

		return '';
	},

	resetLine: function(){
		this.line = '';
	},

	write: function(str){
		this.line+= str;
	},

	writeValue: function(value){
		this.line+= this.stringify(value);
	},

	writePair: function(key, value){
		this.line+= this.stylize(key, 'key') + ': ';
		this.line+= this.stringify(value);
	},

	writeTab: function(count){
		this.line+= this.tab.repeat(count);
	},

	writeLine: function(multiline){
		var line;

		if( multiline ) line = this.newLine;
		else line = ' ';

		this.write(line);
	},

	writeSep: function(multiline){
		if( multiline ){
			this.write(',');
		}
		else{
			this.write(', ');
		}
	},

	readLine: function(){
		return this.line;
	}
});

Inspect.prototype.stringifyObject = function(source){
	if( this.isCircular(source) ) return this.stylize(this.circular, 'circular');
	this.items.push(source);

	var multiline = this.multiline == 'auto' ? this.calcMultiline(source) : this.multiline;
	var out = '';
	var json = '';
	var braclet = '';
	var count = this.count;
	var first = count === 0;

	this.count++;

	if( this.isDeep() ) return this.stylize(this.deep, 'deep');

	if( source instanceof Array ){
		braclet = '[]';

		var i = 0, j = source.length;
		for(;i<j;i++){
			this.resetLine();
			if( multiline ){
				this.writeLine(multiline);
				this.writeTab(count+1);
			}

			this.writeValue(source[i]);

			if( i+1 !== j ) this.writeSep(multiline);
			json+= this.readLine();
		}
	}
	else{
		braclet = '{}';

		// var keys = [];
		// for(var key in source){
			// keys.push(key);
		// }

		var keys = Object.keys(source);

		var i = 0, j = keys.length, key;
		for(;i<j;i++){
			this.resetLine();
			if( multiline ){
				this.writeLine(multiline);
				this.writeTab(count+1);
			}

			key = keys[i];
			this.writePair(key, source[key]);

			if( i+1 !== j ) this.writeSep(multiline);
			json+= this.readLine();
		}
	}

	this.count = count;

	if( json == '' ) return braclet;
	if( count && json.length > this.complexLength ){
		return this.stylize(this.complex, 'complex');
	}

	if( multiline && first ){
		out+= this.newLine;
	}

	if( source instanceof Function ) out+= String.setType('[Function] ', 'function');
	out+= braclet.charAt(0);
	out+= json;

	if( multiline ){
		out+= this.newLine;
		if( !first ){
			out+= this.tab.repeat(count);
		}
	}

	out+= braclet.charAt(1);

	return out;
}

String.prototype.repeat = function(times){
	var motif = this, output = '';
	while(times--){
		output+= motif;
	}
	return output;
};

function prefixConsole(prefix){
	return String.setType(prefix, prefix) + ': ';
}

String.defineType('info', {color: 'green'});
String.defineType('help', {color: 'cyan'});
String.defineType('warn', {color: 'yellow', font: 'bold'});
String.defineType('debug', {color: 'grey', font: 'bold'});
String.defineType('error', {color: 'red', font: 'bold'});

function getPrefix(prefix){
	switch(prefix){
		case 'debug': return String.setType('debug', 'debug') + ': ';
		case 'info': return String.setType('info', 'info') + ': ';
		case 'help': return String.setType('help', 'help') + ': ';
		case 'warn': return String.setType('warn', 'warn') + ': ';
	}
}

var util = require('util');

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

Object.append(console, {
	color: function(){
		var args = Array.slice(arguments);
		args = args.map(function(item){
			return util.inspect(item, false, 4, true);
		});
		console.log.apply(console, args);
	},

	colorAll: function(){
		var args = Array.slice(arguments);
		args = args.map(function(item){
			return util.inspect(item, true, 4, true);
		});
		console.log.apply(console, args);
	},

	prefix: function(prefix, args, method){
		prefix = getPrefix(prefix, prefix);
		args = Array.prototype.slice.call(args);
		args = [prefix].concat(args);

		return method.apply(this, args);
	},

	info: function(){
		return this.prefix('info', arguments, this.log);
	},

	help: function(){
		return this.prefix('help', arguments, this.log);
	},

	warning: console.warn,
	warn: function(){
		return this.prefix('warn', arguments, this.warning);
	},

	// https://github.com/visionmedia/better-assert/blob/master/lib/better-assert.js
	debug: function(data){
		var result = '';

		var
			call = __stack[1],
			file = call.getFileName(),
			lineno = call.getLineNumber(),
			src = FS.readFileSync(file, 'utf8'),
			line = src.split('\n')[lineno-1],
			src = line
			//src = line.match(/debug\((.*)\)/)[1]//line.substr(0, line.length-1)
		;

		var debug = String.setType('debug', 'debug')+': ';
		var inspector = new Inspect();
		var value = '';

		inspector.color = true;
		inspector.newLine = '\n'+debug;

		result = debug + src + ' (' + file + ':' + lineno + ')\n';

		value = inspector.inspect(data);

		if( value.indexOf(inspector.newLine) === 0 ){
			value = debug + value + '\n' + debug
		}
		else{
			value = debug + '\n' + debug + value + '\n' + debug;
		}
		result+= value;

		return console.log(result);
	}
});
