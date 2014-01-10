/*
File help to manipulate a file content line by line

separator: the char used to separate file content into parts (default to '\n')
name: name of the file
size: size of the file
path: path to the file
encoding: encoding of the file
parts: array of parts
state: 'closed' | 'opening' | 'opened' | 'reading' | 'readed' | 'writing' | 'closing' (default to 'closed')

NOTE:
- the file is entirely read and kept into memory
- doesn't support non string data

TODO:

appendPart et replacePart, gérer le fait que data peut émettre une erreur lorsque c'est du JSON invalide

faut rééssayer les trucs maintenant qu'on utilise les buffers

*/

var FilePart = require('./filePart.js');
var FS = require('fs');

var FilePartManager = require(root + '/client/js/lib/emitter.js').extend({
	path: null,
	state: 'closed',
	fd: null,
	stat: null,
	size: null,
	encoding: 'utf8',
	separator: '\n',
	separatorCharCode: null,
	separatorBuffer: null,
	parts: null,

	create: function(path, encoding){
		if( typeof path != 'string' ){
			throw new TypeError('string expected for database file name');
		}
		if( path === '' ){
			throw new TypeError('database file name cannot be empty');
		}

		this.path = path;
		if( typeof encoding == 'string' ){
			if( !Buffer.isEncoding(encoding) ){
				throw new Error(encoding + ' is not a valid encoding');
			}
			this.encoding = encoding;
		}
		this.separatorCharCode = this.separator.charCodeAt(0);
		this.separatorBuffer = new Buffer(this.separator, this.getEncoding());
		this.parts = [];
	},

	error: function(){
		// TODO
	},

	reply: function(callback, bind){
		if( callback == null ){
			callback = console.log;
			bind = console;
		}
		else if( typeof callback != 'function' ){
			throw new TypeError('function expected as callback');
		}

		bind = bind || this;

		return callback.apply(bind, Array.slice(arguments, 2));
	},

	open: function(callback, bind){

		if( this.state != 'closed' ){
			return this.reply(callback, bind, new Error('file already open'));
		}
		
		this.state = 'opening';

		function onopen(error, fd){
			if( error ){
				// crée le fichier si il n'existe pas
				if( error.code == 'ENOENT' && error.errno == 34 ){
					return FS.open(this.path, 'w', onopen.bind(this));
				}
				return this.reply(callback, bind, error);
			}
			
			this.state = 'opened';
			this.fd = fd;
			this.reply(callback, bind, null, fd);
		}

		FS.open(this.path, 'r+', onopen.bind(this));
	},

	close: function(callback, bind){

		if( this.state != 'opened' ){
			return this.reply(callback, bind, new Error('file not opened'));
		}
		if( this.fd == null ){
			return this.reply(callback, bind, new Error('file descriptor is null'));
		}

		function onclose(error){
			if( error ){
				return this.reply(callback, bind, error);
			}

			this.parts = [];
			this.state = 'closed';
			this.fd = null;
			this.stat = null;
			this.size = null;

			this.reply(callback, bind, null);
		}

		this.state = 'closing';
		FS.close(this.fd, onclose.bind(this));
	},

	createPart: function(buffer, byte){
		return FilePart.new(buffer, byte);
	},

	addPart: function(buffer, byte){
		var part = this.createPart(buffer, byte);
		this.parts.push(part);
		return part;
	},

	parseBuffer: function(buffer){
		var byte = 0, i = 0, j = buffer.length, code;

		for(;i<j;i++){
			code = buffer[i];
			if( code == this.separatorCharCode ){
				this.addPart(buffer.slice(byte, i), byte);
				byte = i+1;
			}
		}
		
		// crée une dernière partie pour la fin du fichier
		this.addPart(buffer.slice(byte, j), byte);

		return this.parts;
	},

	getEncoding: function(){
		return this.encoding;
	},

	read: function(callback, bind){
		if( this.state != 'opened' ){
			return this.reply(callback, bind, new Error('file not opened'));
		}

		function onread(error, readed, buffer){
			if( error ){
				return this.reply(callback, bind, error);
			}

			this.state = 'readed';
			this.reply(callback, bind, null, this.parseBuffer(buffer));
		}

		function onstat(error, stat){
			if( error ){
				return this.reply(callback, bind, error);
			}

			this.stat = stat;
			this.size = stat.size;

			if( stat.size === 0 ){
				return onread.call(this, null, 0, '');
			}
			
			FS.read(this.fd, new Buffer(stat.size), 0, stat.size, 0, onread.bind(this));
		}

		this.state = 'reading';
		FS.fstat(this.fd, onstat.bind(this));
	},

	write: function(buffer, byte, callback, bind){
		// byte est un argument optionnel
		if( typeof byte != 'number' ){
			bind = callback;
			callback = byte;
			byte = 0;
		}

		if( this.state != 'readed' ){
			this.reply(callback, bind, new Error('can\'t write: file not in readed state'));
		}

		function onwrite(error, written, buffer){
			if( error ){
				return this.reply(callback, bind, error);
			}

			this.state = 'readed';
			this.size+= buffer.length;

			if( written != buffer.length ){
				error = new Error('write error: ' + written + 'bytes written on ' + buffer.length);
				return this.reply(callback, bind, error);
			}
			
			this.reply(callback, bind);
		}

		if( buffer.length === 0 ){
			onwrite.call(this, null, 0, '');
		}
		else{
			this.state = 'writing';
			FS.write(this.fd, buffer, 0, buffer.length, byte, onwrite.bind(this));
		}
	},

	truncateThenWrite: function(byte, buffer, callback, bind){
		// écrit directement en fin de fichier
		if( byte >= this.size ){
			this.write(buffer, byte, callback, bind);
			return;
		}

		// tronque avant d'écrire en fin de fichier
		function ontruncate(error){
			if( error ){
				return this.reply(callback, bind, error);
			}

			this.size = byte;
			this.write(buffer, byte, callback, bind);
		}

		FS.truncate(this.fd, byte, ontruncate.bind(this));
	},

	getDataAfterPart: function(index){
		var i = index, j = this.parts.length, buffer = new Buffer(0), list;
		
		for(;i<j;i++){
			list = [buffer];
			if( i !== index ){
				list.push(this.separatorBuffer);
			}
			list.push(this.parts[i].buffer);
			buffer = Buffer.concat(list);
		}

		return buffer;
	},

	appendPart: function(data, callback, bind){
		var index = this.parts.length, lastPart = this.parts[index - 1], part, byte = 0;
		var empty = index === 1 && lastPart.buffer.length === 0, buffer, writeBuffer, writeByte;
				
		buffer = new Buffer(data, this.getEncoding());		
		writeBuffer = buffer;		
		writeByte = byte;

		// si le fichier n'est pas vide
		if( !empty ){
			byte = lastPart.byte + lastPart.buffer.length + this.separatorBuffer.length;
			part = this.createPart(buffer, byte);

			// create a temporary buffer to write the separator and the new part
			writeBuffer = Buffer.concat([this.separatorBuffer, buffer]);
			// start to write at separator
			writeByte = byte - this.separatorBuffer.length;
		}
		
		this.write(writeBuffer, writeByte, function(error){
			if( error ){
				return this.reply(callback, bind, error);
			}
			
			if( empty ){
				lastPart.setBuffer(buffer);
				part = lastPart;
			}
			else{
				this.parts.push(part);
			}
			
			this.reply(callback, bind, part);
		});
	},

	replacePart: function(index, data, callback, bind){
		var part = this.parts[index], i, j, buffer, writeBuffer, diff;

		if( !part ){
			return this.reply(callback, bind, new Error('no part found at index ' + index));
		}

		buffer = new Buffer(data, this.getEncoding());
		writeBuffer = buffer;

		if( index != (this.parts.length - 1) ){
			writeBuffer = Buffer.concat([buffer, this.separatorBuffer]);
		}
		diff = part.buffer.length - writeBuffer.length;

		function onsuccess(error){
			if( error ){
				return this.reply(callback, bind, error);
			}

			part.setBuffer(buffer);

			// décale toutes les lignes suivantes
			if( diff !== 0 ){
				i = index + 1;
				j = this.parts.length;
				for(;i<j;i++){
					this.parts[i].byte-= diff;
				}
			}

			this.reply(callback, bind, null, part);
		}

		if( diff === 0 ){
			this.write(writeBuffer, part.byte, onsuccess);
		}
		else{
			this.truncateThenWrite(part.byte, Buffer.concat([writeBuffer, this.getDataAfterPart(index + 1)]), onsuccess);
		}

		return part;
	},

	removePart: function(index, callback, bind){
		var part = this.parts[index], i, j, diff, byte;

		if( !part ){
			return this.reply(callback, bind, new Error('no part found at index ' + index));
		}

		diff = part.buffer.length;
		byte = part.byte;
		
		// je supprime la dernière ligne
		if( index === (this.parts.length - 1) ){
			// la ligne d'avant perds son séparateur je dois dont truncate à cet endroit là
			byte-= this.separatorBuffer.length;
		}
		// la ligne suivante perd son séparateur ce qui décale d'autant le bytes des lignes suivantes
		else{
			diff+= this.separatorBuffer.length;
		}
		
		this.truncateThenWrite(byte, this.getDataAfterPart(index + 1), function(error){
			if( error ){
				return this.reply(callback, bind, error);
			}

			if( diff !== 0 ){
				i = index + 1;
				j = this.parts.length;
				for(;i<j;i++){
					this.parts[i].byte-= diff;
				}
			}

			// il n'y a qu'une partie: cette partie devient vide
			if( index === 0 && this.parts.length == 1  ){
				part.empty();
			}
			// on supprime totalement cette partie
			else{
				this.parts.splice(index, 1);
			}

			this.reply(callback, bind, null, part);
		});
	}
});

module.exports = FilePartManager;

/*
updateLine: function(index, properties){
		var line = this.lines[index], item = line.item, key, changed = false;

		for(key in properties){
			if( item[key] !== properties[key] ){
				this.emit('change', key, item[key], properties[key]);
				item[key] = properties[key];
				changed = true;
			}
		}

		if( changed ){
			this.exec('replaceLine', index, this.stringify(item), item);
		}
	},

LineFile.supplement({
	_match: function(match, fn, first){
		match = Finder.from(match);
		var lines = this.lines, i = 0, j = lines.length, line;

		for(;i<j;i++){
			line = lines[i];
			if( match.call(this, line.item) ){
				fn.call(this, line.item, i);
				if( first ) break;
			}
		}
	},

	match: function(match, fn){
		return this._match(match, fn, true);
	},

	matchAll: function(match, fn){
		return this._match(match, fn);
	},

	stack: function(){
		this.pile.push(arguments);
	},

	unstack: function(){
		return this.pile.length ? this.pile.shift() : null;
	},

	drain: function(){
		this.emit('drain');
	},

	lock: function(){
		this.lockers++;
	},

	unlock: function(){
		if( this.isLocked() ){
			this.lockers--;
		}

		if( !this.isLocked() ){
			var pile = this.unstack();
			if( pile ){
				this.beforeExec.apply(this, pile);
			}
			else{
				this.drain();
			}
		}
	},

	isLocked: function(){
		return this.lockers !== 0;
	},

	watchChanges: function(){
		this.watching = true;
	},

	warn: function(message){
		console.warn(message);
	},

	error: function(error){
		if( typeof error == 'string' ) error = new Error(error);
		// l'ouverture a échouée, l'appel ne seras pas effectué
		if( this.oncesuccess ) delete this.oncesuccess;

		this.reply(error);
		this.unlock();
	},

	success: function(){
		var oncesuccess = this.oncesuccess;
		if( oncesuccess ){
			delete this.oncesuccess;
			oncesuccess.call(this);
		}
		else{
			this.reply.apply(this, [null].concat(Array.slice(arguments)));
			this.unlock();
		}
	},

	reply: function(){
		if( this.callback ){
			this.callback.apply(this, arguments);
		}
	},

	// dès que possible l'appel seras lancé
	demand: function(action, args){
		if( this.isLocked() ){
			this.stack(action, args);
		}
		else{
			this.beforeExec(action, args);
		}
	},

	beforeExec: function(action, args){
		delete this.callback;

		if( args ){
			args = Array.slice(args);
			var i = args.length;
			while(i--){
				if( typeof args[i] == 'function' ){
					this.callback = args[i];
					break;
				}
			}
		}
		else{
			args = [];
		}

		this.action = action;
		this.args = args;

		this.lock();
		// on doit ouvrir la table si elle n'a jamais été ouverte, seulement ensuite on procède à l'action
		if( this.state != 'opened' && action != 'open' ){
			this.oncesuccess = function(){ this.exec.apply(this, [this.action].concat(this.args)); };
			this.open();
		}
		else{
			this.exec.apply(this, [action].concat(args));
		}
	},

	exec: function(action){
		if( this.watching && ['appendLine', 'removeLine', 'replaceLine'].indexOf(action) !== -1 ){
			this.changes.push(Array.slice(arguments));
			return;
		}

		var args = Array.slice(arguments, 1);
		this.methods[action].apply(this, args);
	},

	before: function(event, fn){
		return this.on('before' + event, fn);
	}
});

LineFile.defineAction = function(name, method){
	LineFile.methods[name] = method;
	LineFile[name] = function(){
		this.demand(name, arguments);
	};
};

LineFile.defineActions = function(actions){
	for(var action in actions){
		LineFile.defineAction(action, actions[action]);
	}
};

LineFile.defineActions({
	asap: function(fn){
		// appelle la fonction qu'on veut
		fn.call(this);
		// si cette fonction n'a rien déclenché de bloquant
		if( !this.isLocked() ){
			// on déclenche le callback sans erreur
			this.callback();
		}
	},

	eval: function(fn){
		fn.apply(this, Array.slice(arguments, 1));
	},

	read: function(){
		this.success(this.lines);
	},

	/*
	find: function(match){
		this.success(this.items.find(match));
	},

	findAll: function(match){
		this.success(this.items.findAll(match));
	},

	insert: function(item){
		this.watchChanges();
		this.exec('appendLine', this.stringify(item));
		this.applyChanges();
	},

	insertAll: function(items){
		this.watchChanges();
		var i = 0, j = items.length;
		for(;i<j;i++){
			this.exec('appendLine', this.stringify(items[i]));
		}
		this.applyChanges();
	},

	remove: function(match){
		this.watchChanges();
		this.match(match, function(item, index){ this.exec('removeLine', index); });
		this.applyChanges();
	},

	removeAll: function(match){
		this.watchChanges();
		this.matchAll(match, function(item, index){ this.exec('removeLine', index); });
		this.applyChanges();
	},

	update: function(match, properties){
		this.watchChanges();
		this.match(match, function(item, index){ this.updateLine(index, properties); });
		this.applyChanges();
	},

	updateAll: function(match, properties){
		this.watchChanges();
		this.matchAll(match, function(item, index){ this.updateLine(index, properties); });
		this.applyChanges();
	}
});
*/
