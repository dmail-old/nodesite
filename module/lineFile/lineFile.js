/*
LIneFile help to manipulate a file line by line

separator: the char used to separate lines in that file (default to '\n')
name: name of the file
size: size of the file
path: path to the file
encoding: encoding of the file
lines: array of lines
state: 'closed' | 'opening' | 'opened' | 'closing' (default to 'closed')
lockers: number of lock on the Table avoiding it to be modified until unlocked

NOTE:
- the file is entirely read and kept into memory
- doesn't support non string data

TODO:

gestion des erreurs lorsque le fichier existe pas ou autre
lecture auto du fichier lorsqu'on cherche à effectuer une opération dessus

*/

var Line = require('./line.js');
var FS = require('fs');

var LineFile = require(root + '/client/js/lib/emitter.js').extend({
	path: null,
	separator: '\n',
	separatorCharCode: null,
	encoding: 'utf8',	
	size: null,
	lines: null,
	fd: null,
	stat: null,
	state: 'closed',

	// lockers: 0,
	// pile: null,
	// datas: null, array of lines string

	create: function(path, encoding){
		if( typeof path != 'string' ){
			throw new TypeError('string expected for database file name');
		}
		if( path === '' ){
			throw new TypeError('database file name cannot be empty');
		}

		this.path = path;
		if( typeof encoding == 'string' ) this.encoding = encoding;
		this.separatorCharCode = this.separator.charCodeAt(0);
		this.lines = [];
	},

	createLine: function(byte, data){
		return Line.new(byte, data);
	},

	error: function(){
		// TODO
	},

	getEncoding: function(){
		return this.encoding;
	},

	byteLength: function(data){
		return Buffer.byteLength(data, this.getEncoding());
	},

	addLine: function(byte, data){
		this.lines.push(this.createLine(byte, data));
	},

	parseBuffer: function(buffer){
		var byte = 0, i = 0, j = buffer.length, code, encoding = this.getEncoding();

		for(;i<j;i++){
			code = buffer[i];
			if( code == this.separatorCharCode ) {
				this.addLine(byte, buffer.slice(byte, i).toString(encoding));
				byte = i+1;
			}
		}

		// crée une dernière ligne pour la fin du fichier
		this.addLine(byte, buffer.slice(byte, j).toString(encoding));
	},

	open: function(callback, bind){
		bind = bind || this;
		this.state = 'opening';	

		function onread(error, readed, buffer){
			if( error ){
				return callback.call(bind, error);
			}

			this.parseBuffer(buffer);
			callback.call(bind, null, this.lines);
		}

		function onstat(error, stat){
			if( error ){
				return this.callback.call(this.bind, error);
			}

			this.stat = stat;
			this.size = stat.size;

			if( stat.size === 0 ){
				return onread.call(this, null, 0, '');
			}
			
			this.state = 'reading';
			FS.read(this.fd, new Buffer(stat.size), 0, stat.size, 0, onread.bind(this));
		}

		function onopen(error, fd){
			if( error ){
				// crée la table si elle n'existe pas
				if( error.code == 'ENOENT' && error.errno == 34 ){
					return FS.open(this.path, 'w', onopen.bind(this));
				}
				return callback.call(bind, error);
			}
			
			this.state = 'opened';
			this.fd = fd;
			FS.fstat(fd, onstat.bind(this));
		}

		FS.open(this.path, 'r+', onopen.bind(this));
	},

	close: function(callback, bind){
		bind = bind || this;

		if( this.fd == null ){
			return callback.call(bind, new Error('Line manager not opened'));
		}

		function onclose(error){
			if( error ){
				return callback.call(bind, error);
			}

			this.lines = [];
			this.state = 'closed';
			this.fd = null;
			this.stat = null;
			this.size = null;

			callback.call(bind);
		}		

		this.state = 'closing';
		FS.close(this.fd, onclose.bind(this));
	}
});

LineFile.supplement({
	writeAfterByte: function(byte, data, callback, bind){
		bind = bind || this;

		function onwrite(error, written, buffer){
			if( error ){
				return callback.call(bind, error);
			}

			if( written != buffer.length ){
				error = new Error('write error: ' + written + 'bytes written on ' + buffer.length);
				return callback.call(bind, error);
			}

			this.size+= buffer.length;
			callback.call(bind);
		}

		if( data === '' ){
			onwrite.call(this, null, 0, '');
		}
		else{
			FS.write(this.fd, data, byte, this.byteLength(data), onwrite.bind(this));
		}
	},

	getDataAfterLine: function(index){
		var i = index, j = this.lines.length, data = '';
		for(;i<j;i++){
			if( i !== index ){
				data+= this.separator;
			}
			data+= this.lines[i].data;
		}

		return data;
	},

	truncateAndWriteAfterByte: function(byte, data, callback, bind){
		// écrit directement en fin de fichier
		if( byte >= this.size ){
			this.writeAfterByte(byte, data, callback, bind);
			return;
		}
		// tronque avant d'écrire en fin de fichier
		function ontruncate(error){
			if( error ){
				return this.callback.call(this.bind, error);
			}

			this.size = byte;
			this.writeAfterByte(byte, data, callback, bind);
		}

		FS.truncate(this.fd, byte, ontruncate.bind(this));
	},

	replaceLine: function(index, data, callback, bind){
		var line = this.lines[index], i, j, oldLength = this.byteLength(line.data), length, diff;

		line.setData(data);
		length = this.byteLength(line.data);
		diff = oldLength - length;

		// décale toutes les lignes suivantes
		if( diff !== 0 ){
			i = index + 1;
			j = this.lines.length;
			console.log('décale toutes les lignes suivantes de ', diff);
			for(;i<j;i++){
				this.lines[i].byte-= diff;
			}
		}

		if( diff === 0 ){
			this.writeAfterByte(line.byte, line.data, callback, bind);
		}
		else{
			this.truncateAndWriteAfterByte(line.byte, this.getDataAfterLine(index), callback, bind);
		}
	},

	removeLine: function(index, callback, bind){
		var line = this.lines[index], i, j, diff = this.byteLength(line.data);

		// je supprime la première ligne
		if( index === 0 ){
			// il n'y a qu'une ligne: le fichier devient vide et c'est tout
			if( this.lines.length == 1 ){
				line.empty();
				FS.truncate(this.fd, 0, callback, bind);
				return;
			}

			// la ligne suivante perd son séparateur ce qui décale d'autant le bytes des lignes suivantes
			diff+= this.byteLength(this.separator);
		}

		if( diff !== 0 ){
			i = index + 1;
			j = this.lines.length;
			for(;i<j;i++){
				this.lines[i].byte-= diff;
			}
		}

		this.lines.splice(index, 1);
		this.truncateAndWriteAfterByte(line.byte, this.getDataAfterLine(index), callback, bind);
	},

	appendLine: function(data, callback, bind){
		var index = this.lines.length, lastLine = this.lines[index - 1], byte, line;

		// le fichier est actuellement vide
		if( index === 1 && lastLine.data === '' ){
			byte = 0;
		}
		else{
			byte = lastLine.byte + this.byteLength(lastLine.data) + this.byteLength(this.separator);
		}

		this.lines.push(this.createLine(byte, data));
		this.writeAfterByte(byte - this.byteLength(this.separator), this.separator + data, callback, bind);
	}
});

module.exports = LineFile;

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
