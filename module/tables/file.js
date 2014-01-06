
/*
File help to manipulate database files

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
var Finder = require('./finder.js');
var FS = require('fs');

var File = require(root + '/client/js/lib/emitter.js').extend({
	dirpath: './data',
	separator: '\n',
	separatorCharCode: null,
	name: null,
	encoding: 'utf8',
	path: null,
	size: 0,
	lines: null,
	fd: null, // filedescriptor id for filesystem
	stat: null,

	methods: {},
	state: 'closed',
	lockers: 0,

	pile: null,
	changes: null,

	create: function(name, encoding){
		if( typeof name != 'string' ){
			throw new TypeError('string expected for database file name');
		}
		if( name === '' ){
			throw new TypeError('database file name cannot be empty');
		}

		this.name = name;
		this.path = this.dirpath + '/' + name;
		if( typeof encoding == 'string' ) this.encoding = encoding;
		this.separatorCharCode = this.separator.charCodeAt(0);
		this.lines = [];

		this.pile = [];
		this.changes = [];
	},

	getEncoding: function(){
		return this.encoding;
	},

	byteLength: function(data){
		return Buffer.byteLength(data, this.getEncoding());
	},

	readLine: function(byte, data){
		this.lines.push(Line.new(byte, data));
	},

	readLines: function(buffer){
		var byte = 0, i = 0, j = buffer.length, code;

		for(;i<j;i++){
			code = buffer[i];
			if( code == this.separatorCharCode ) {
				this.readLine(byte, buffer.slice(byte, i).toString(this.getEncoding()));
				byte = i+1;
			}
		}

		// crée une dernière ligne pour la fin du fichier
		this.readLine(byte, buffer.slice(byte, j).toString(this.getEncoding()));

		this.success();
	},

	replaceLine: function(index, data){
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
	},

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

	removeLine: function(index){
		var line = this.lines[index], i, j, diff = this.byteLength(line.data);

		// je supprime la première ligne
		if( index === 0 ){
			// il n'y a qu'une ligne: le fichier devient vide et c'est tout
			if( this.lines.length == 1 ){
				line.data = '';
				line.item = {};
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
	},

	appendLine: function(data){
		var index = this.lines.length, lastLine = this.lines[index - 1], byte, line;

		// le fichier est actuellement vide
		if( index === 1 && lastLine.data === '' ){
			byte = 0;
		}
		else{
			byte = lastLine.byte + this.byteLength(lastLine.data) + this.byteLength(this.separator);
		}

		this.lines.push(Line.new(byte, data));
	},

	write: function(){
		FS.open(this.path, 'w', function(error, fd){
			if( error ){
				return this.error(error);
			}

			return this.success(fd);
		});
	},

	open: function(){
		this.state = 'opening';

		function onopen(error, fd){
			if( error ){
				// crée la table si elle n'existe pas
				if( error.code == 'ENOENT' && error.errno == 34 ){
					this.oncesuccess = function(fd){
						onopen.call(this, fd);
					};
					this.write();
				}
				return this.error(error);
			}

			this.state = 'opened';
			this.fd = fd;
			FS.fstat(fd, onstat.bind(this));
		}

		function onstat(error, stat){
			if( error ) return this.error(error);

			this.stat = stat;
			this.size = stat.size;
			this.ctime = stat.ctime;
			this.mtime = stat.mtime;

			if( stat.size === 0 ){
				onread.call(this, null, 0, '');
			}
			else{
				FS.read(this.fd, new Buffer(stat.size), 0, stat.size, 0, onread.bind(this));
			}
		}

		function onread(error, readed, buffer){
			if( error ) return this.error(error);

			this.readLines(buffer);
		}

		FS.open(this.path, 'r+', onopen.bind(this));
	},

	close: function(){
		if( this.fd == null ){
			return this.error('Line manager not opened');
		}

		this.state = 'closing';

		function onclose(error){
			if( error ) return this.error(error);
			this.state = 'closed';
			this.fd = null;
			this.lines = [];
			this.stat = null;
			this.size = 0;
			this.success();
		}

		FS.close(this.fd, onclose.bind(this));
	},

	onwrite: function(error, written, buffer){
		if( error ){
			return this.error(error);
		}

		if( written != buffer.length ){
			return this.error('write partiel, devait écrire: ' + buffer.length + ', à écrit:' + written);
		}

		this.size+= buffer.length;
		this.success();
	},

	writeData: function(byte, data){
		if( data === '' ){
			this.onwrite(null, 0, '');
		}
		else{
			FS.write(this.fd, data, byte, this.byteLength(data), this.onwrite.bind(this));
		}
	},

	applyChanges: function(){
		var changes = this.changes, i = 0, j = changes.length, minModifiedLineIndex = null, action, gap = 0;

		delete this.watching;

		this.changes = [];

		if( j === 0 ) return this.success(0);

		var change, args, modifiedLineIndex, fastRewrite = false;

		if( j === 1 && changes[0][0] == 'replaceLine' ){
			this.once('beforereplaceLine', function(index){
				var oldLength = this.byteLength(this.lines[index].data);
				this.once('replaceLine', function(index){
					if( oldLength == this.byteLength(this.lines[index].data) ){
						fastRewrite = true;
					}
				});
			});
		}

		for(;i<j;i++){
			change = changes[i];
			action = change[0];
			args = change.slice(1);

			switch(action){
			case 'appendLine':
				modifiedLineIndex = this.lines.length - 1;
				break;
			case 'removeLine':
				args[0]-= gap;
				modifiedLineIndex = args[0];
				gap++;
				break;
			case 'replaceLine':
				args[0]-= gap;
				modifiedLineIndex = args[0];
				break;
			}

			// lance l'action
			this.emit.apply(this, ['before' + action].concat(args));
			this[action].apply(this, args);
			this.emit.apply(this, [action].concat(args));

			if( minModifiedLineIndex == null || modifiedLineIndex < minModifiedLineIndex ){
				minModifiedLineIndex = modifiedLineIndex;
			}
		}

		function writeEnd(){
			var i = minModifiedLineIndex, j = this.lines.length, data = '';
			for(;i<j;i++){
				if( i !== minModifiedLineIndex){
					data+= this.separator;
				}
				data+= this.lines[i].data;
			}

			// console.log('réécrit les ligne depuis', upperLine.index, '50 dernier carac', end.substr(end.length-50));
			this.writeData(this.lines[minModifiedLineIndex].byte, data);
		}

		if( fastRewrite ){
			console.log('réécritue éclair par dessus');
			this.writeData(this.lines[minModifiedLineIndex].byte, this.lines[modifiedLineIndex].data);
			return;
		}

		var minByte = this.lines[minModifiedLineIndex].byte;

		function ontruncate(error){
			if( error ) return this.error(error);

			this.size = minByte;
			// console.log('coupe le fichier à la longueur', upperLine.byte, 'contenu:', this.content);
			writeEnd.call(this);
		}

		// tronque avant d'écrire en fin de fichier
		if( minByte < this.size ){
			FS.truncate(this.fd, minByte, ontruncate.bind(this));
		}
		// écrit directement en fin de fichier
		else{
			writeEnd.call(this);
		}
	},

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
	}
});

File.supplement({
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

File.defineAction = function(name, method){
	File.methods[name] = method;
	File[name] = function(){
		this.demand(name, arguments);
	};
};

File.defineActions = function(actions){
	for(var action in actions){
		File.defineAction(action, actions[action]);
	}
};

File.defineActions({
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
	*/

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

module.exports = File;

