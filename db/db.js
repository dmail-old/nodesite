/* global Finder */

/*

MORE
- une fonction insertLine pour insérer une line entre d'autre ligne?

NOTE
- lorsqu'on populate les référence, l'objet qu'on référence peut lui même avoir des référence, on peut alors les populates elles aussi
dans ce cas, on doit détecter les référence circulaire pour ne pas populate en boucle

TODO
- vider la mémoire qu'on a de cette table après un temps d'inactivité (?)

- dans les schémas
enum: type string only, doit faire partie d'une liste
index: indexe la propriété pour une lecture plus rapide
min, max, pattern, singleSpace, trim sont spécifiques aux nombres ou aux chaines hors il est quand même possible de mettre cela si on a mit type number

- les schémas doivent s'opérer coté client pour que je dispose du bon objet, la BDD se contente de faire les actions basique qu'on lui demande
seul unique et ref resteront coté BDD

- faire quelque chose de souple et clair pour répondre aux demandes
créer une class request et response?

*/

var FS = require('fs');
require('./types.js');

var DB = {
	separator: '\n',
	schemas: require('./schemas.js'),
	tables: {},

	start: function(){
		var table, tables = this.tables, rules, key;

		this.separatorCharCode = this.separator.charCodeAt(0);

		for(table in this.schemas){
			this.getTable(table);
		}

		for(table in tables){
			table = tables[table];
			if( table.hasRule() ){
				rules = table.getRule();
				for(key in rules){
					if( table.hasRule(key, 'ref') ){
						this.getTable(table.getRule(key, 'ref')).references.push({table: table.name, key:key});
					}
				}
			}
		}
	},

	getTable: function(name){
		var table = this.tables[name];
		if( !table ){
			table = this.tables[name] = Item.new('table', name);
		}
		return table;
	},

	getTables: function(callback){
		callback.call(this, this.tables);
	},

	getSchema: function(table){
		table = this.getTable(table);
		//callback.call(this, table.schema);
	}
};

var Table = Item.create('table', 'emitter', {
	methods: {},
	state: 'closed',
	lockers: 0,
	uid: 0,
	length: 0,
	size: 0,

	constructor: function(name){
		this.pile = [];
		this.changes = [];
		this.items = [];
		this.bytes = [];
		this.datas = [];
		this.references = [];
		this.modifiedReferences = {};
		this.removedReferences = [];

		this.name = name;
		this.path = root + '/db/tables/' + name;
		this.schema = Object.merge({}, DB.schemas.default, DB.schemas[name] || {});

		this.on('change', function(key, oldValue, value){
			if( key == 'id' ){
				this.modifiedReferences[oldValue] = value;
			}
		});
		this.before('removeLine', function(index){
			if( this.references.length ){
				this.removedReferences.push(this.items[index].id);
			}
		});
	},

	getEncoding: function(){
		return this.schema.encoding;
	},

	byteLength: function(data){
		return Buffer.byteLength(data, this.getEncoding());
	},

	parse: function(data){
		var item = null;

		if( data.length ){
			try{
				item = JSON.parse(data);/*, function(key, value){
					if( key == 'byte' || key == 'index' || key == 'data' ) return this.error('les propriétés index, byte et data sont réservé à la BDD');
				}.bind(this));*/
			}
			catch(e){
				this.warn('ligne ' +this.length+' malformée' + data);
				this.error(e);
			}
		}

		return item;
	},

	stringify: function(line){
		var data = '';
		try{
			data = JSON.stringify(line, function(key, value){
				if( key == 'line' ) return undefined;
				return value;
			});
		}
		catch(e){
			this.warn('objet ne pouvant pas être convertit en chaine');
		}

		return data;
	},

	createLine: function(byte, data){
		this.bytes[this.length] = byte;
		this.datas[this.length] = data;
		this.items[this.length] = this.parse(data) || {};
		this.length++;
	},

	splitItems: function(buffer){
		var pointer = 0, i = 0, j = buffer.length, code;

		for(;i<j;i++){
			code = buffer[i];
			if( code == DB.separatorCharCode ) {
				this.createLine(pointer, buffer.slice(pointer, i).toString(this.getEncoding()));
				pointer = i+1;
			}
		}

		// crée une dernière ligne pour la fin du fichier
		this.createLine(pointer, buffer.slice(pointer, j).toString(this.getEncoding()));

		this.success();
	},

	stack: function(){
		this.pile.push(arguments);
	},

	unstack: function(){
		return this.pile.length ? this.pile.shift() : null;
	},

	drain: function(){

	},

	lock: function(){
		this.lockers++;
	},

	unlock: function(){
		if( this.lockers !== 0 ) this.lockers--;

		if( this.lockers === 0 ){
			var pile = this.unstack();
			if( pile ) this.beforeExec.apply(this, pile);
			else this.drain();
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
			this.reply.apply(this, [null].concat(toArray(arguments)));
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
			args = toArray(args);
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
			this.exec('open');
		}
		else{
			this.exec.apply(this, [action].concat(args));
		}
	},

	exec: function(action){
		if( this.watching && ['appendLine','removeLine','replaceLine'].indexOf(action) !== -1 ){
			this.changes.push(toArray(arguments));
			return;
		}

		var args = toArray(arguments, 1);
		this.methods[action].apply(this, args);
	},

	before: function(event, fn){
		return this.on('before'+event, fn);
	},
});

Table.defineAction = function(name, method){
	Table.methods[name] = method;
	Table[name] = function(){
		this.demand(name, arguments);
	};
};

Table.defineActions = function(actions){
	for(var action in actions){
		Table.defineAction(action, actions[action]);
	}
};

// open, close, save, appendLine, removeLine, replaceLine
Table.defineActions({
	create: function(){
		FS.open(this.path, 'w', function(error, fd){
			if( error ) return this.error(error);
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
					this.exec('create');
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

			this.splitItems(buffer);
		}

		FS.open(this.path, 'r+', onopen.bind(this));
	},

	close: function(){
		if( !this.fd ) return this.error('Line manager not opened');

		this.state = 'closing';

		function onclose(error){
			if( error ) return this.error(error);
			this.state = 'closed';
			delete this.fd;
			this.success();
		}

		FS.close(this.fd, onclose.bind(this));
	},

	replaceLine: function(index, data, item){
		var currentData = this.datas[index], i, j, diff = this.byteLength(currentData) - this.byteLength(data);

		// décale toutes les lignes suivantes
		if( diff !== 0 ){
			i = index + 1;
			j = this.length;
			console.log('décale toutes les lignes suivantes de ', diff);
			for(;i<j;i++){
				this.bytes[i]-= diff;
			}
		}

		this.datas[index] = data;
		this.items[index] = item || this.parse(data) || {};
	},

	removeLine: function(index){
		var currentData = this.datas[index], i, j, diff = this.byteLength(currentData);

		// je supprime la première ligne
		if( index === 0 ){
			// il n'y a qu'une ligne: le fichier devient vide et c'est tout
			if( this.length == 1 ){
				this.datas[0] = '';
				this.items[0] = {};
				return;
			}

			// la ligne suivante perd son séparateur ce qui décale d'autant le bytes des lignes suivantes
			diff+= this.byteLength(DB.separator);
		}

		if( diff !== 0 ){
			i = index + 1;
			j = this.length;
			for(;i<j;i++){
				this.bytes[i]-= diff;
			}
		}

		this.bytes.splice(index, 1);
		this.datas.splice(index, 1);
		this.items.splice(index, 1);
		this.length--;
	},

	appendLine: function(data, item){
		var index = this.length, lastData = this.datas[index-1], byte = 0;

		// le fichier est actuellement vide
		if( index === 1 && lastData === '' ){
			index = 0;
		}
		else{
			this.bytes[index] = this.bytes[index-1] + this.byteLength(lastData) + this.byteLength(DB.separator);
			this.length++;
		}

		this.datas[index] = data;
		this.items[index] = item || this.parse(data) || {};
	}
});

Table.implement({
	updateLine: function(index, properties){
		var item = this.items[index], key, changed = false;

		for(key in properties){
			if( !this.compare(key, item[key], this.decode(properties[key])) ){
				this.emit('change', key, item[key], properties[key]);
				item[key] = properties[key];
				changed = true;
			}
		}

		if( changed ){
			var rules = this.getRule();
			for(key in rules){
				if( this.hasRule(key, 'onupdate') ){
					item[key] = this.getRule(key, 'onupdate').call(this, properties);
				}
			}

			this.exec('replaceLine', index, this.stringify(item), item);
		}
	},

	applyChanges: function(){
		var changes = this.changes, i = 0, j = changes.length, minIndex = null, action, gap = 0;

		delete this.watching;

		this.changes = [];

		if( j === 0 ) return this.success(0);

		this.oncesuccess = function(){
			function updateModified(){
				var pairs = Object.pairs(this.modifiedReferences), keys = pairs[0], values = pairs[1];

				if( keys.length ){
					this.modifiedReferences = {};

					keys = keys.map(Number);

					this.updateAllReferences(keys, values, function(error){
						if( error ) return this.error(error);
						updateRemoved.call(this);
					});
				}
				else{
					updateRemoved.call(this);
				}
			}

			function updateRemoved(){
				var removed = this.removedReferences;

				if( removed.length ){
					this.removedReferences = [];

					this.removeAllReferences(removed, function(error){
						if( error ) return this.error(error);
						this.success(j);
					});
				}
				else{
					this.success(j);
				}
			}

			updateModified.call(this);
		};

		var change, args, index;

		for(;i<j;i++){
			change = changes[i];
			action = change[0];
			args = change.slice(1);

			switch(action){
			case 'appendLine':
				index = this.length-1;
				break;
			case 'removeLine':
				args[0]-= gap;
				index = args[0];
				gap++;
				break;
			case 'replaceLine':
				args[0]-= gap;
				index = args[0];
				break;
			}

			// lance l'action
			this.emit.apply(this, ['before'+action].concat(args));
			this.methods[action].apply(this, args);
			this.emit.apply(this, [action].concat(args));

			if( minIndex == null || index < minIndex ) minIndex = index;
		}

		function onwrite(error, written, buffer){
			if( error ) return this.error(error);
			if( written != buffer.length ) return this.error('write partiel, devait écrire: '+buffer.length+', à écrit:' + written);

			this.size+= buffer.length;
			this.success(j);
		}

		function write(data){
			if( data === '' ){
				onwrite.call(this, null, 0, '');
			}
			else{
				FS.write(this.fd, data, this.bytes[minIndex], this.byteLength(data), onwrite.bind(this));
			}
		}

		function writeEnd(){
			var i = minIndex, j = this.length, end = '';
			for(;i<j;i++){
				if( i !== minIndex) end+= DB.separator;
				end+= this.datas[i];
			}

			// console.log('réécrit les ligne depuis', upperLine.index, '50 dernier carac', end.substr(end.length-50));
			write.call(this, end);
		}

		// FIX: this.datas[index] == args[1] vaut toujours true
		// suffit de réécrire la ligne par dessus
		if( false && j === 1 && action == 'replaceLine' && this.byteLength(this.datas[index]) == this.byteLength(args[1]) ){
			console.log('réécritue éclair par dessus');
			write.call(this, this.datas[index]);
		}
		else{
			var minByte = this.bytes[minIndex];

			console.log(minByte);

			// tronque avant d'écrire en fin de fichier
			if( minByte < this.size ){
				function ontruncate(error){
					if( error ) return this.error(error);

					this.size = minByte;
					// console.log('coupe le fichier à la longueur', upperLine.byte, 'contenu:', this.content);
					writeEnd.call(this);
				}

				FS.truncate(this.fd, minByte, ontruncate.bind(this));
			}
			// écrit directement en fin de fichier
			else{
				writeEnd.call(this);
			}
		}
	},

	_match: function(match, fn, first){
		match = Finder.from(match);
		var items = this.items, i = 0, j = items.length, item;

		for(;i<j;i++){
			item = items[i];
			if( match.call(this, item) ){
				fn.call(this, item, i);
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

Table.defineActions({
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
		fn.apply(this, toArray(arguments, 1));
	},

	read: function(){
		this.success(this.items);
	},

	find: function(match){
		this.success(this.items.find(match));
	},

	findAll: function(match){
		this.success(this.items.findAll(match));
	},

	insert: function(item){
		var key, rules = this.getRules(), result;

		// met les propriétés par défaut
		for(key in rules){
			if( this.hasRule(key, 'default') && !(key in item) ){
				item[key] = this.getDefault(key);
			}
		}

		this.matchRules(item, function(error){
			if( error ) return this.error(error);

			this.watchChanges();
			this.exec('appendLine', this.stringify(item), item);

			this.applyChanges();
		});
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
		this.matchRules(properties, function(error){
			if( error ) return this.error(error);

			this.watchChanges();
			this.match(match, function(item, index){
				this.updateLine(index, properties);
			});
			this.applyChanges();
		});
	},

	updateAll: function(match, properties){
		this.matchRules(properties, function(error){
			if( error ) return this.error(error);

			this.watchChanges();
			this.matchAll(match, function(item, index){
				this.updateLine(index, properties);
			});
			this.applyChanges();
		});
	}
});

/*
---

name: schemas

description: oblige les propriétés des objets de la BDD à suivre un schéma

...
*/

// autres
Table.implement({
	getItem: function(key, value){
		var i = 0, j = this.items.length, item;
		for(;i<j;i++){
			item = this.items[i];
			if( item && this.compare(key, item[key], value) ) return item;
		}
		return null;
	},

	nextFree: function(key, value, count){
		switch(key){
		case 'name':
			return (count ? value.substr(0, value.lastIndexOf(' ')) : value) + ' ('+(count + 2)+')';
		//case 'id':
		default:
			return value + 1;
		}
	},

	isFree: function(key, value){
		// aucun item[key] ne doit être égal à value
		return !this.getItem(key, value);
	},

	getFree: function(key, value){
		var count = 0;
		while( !this.isFree(key, value) ){
			value = this.nextFree(key, value, count++);
		}
		return value;
	}
});

Table.setters = {
	set: function(value, setter){
		return setter.call(this, value);
	},

	trim: function(value){
		return value.trim();
	},

	upperCase: function(value){
		return value.toUpperCase();
	},

	lowerCase: function(value){
		return value.toLowerCase();
	},

	singleSpace: function(value){
		return value.replace(/\s+/, ' ');
	}
};

Table.getters = {
	get: function(value, getter){
		return getter.call(this, value);
	}
};

Table.validators = [];
Table.addValidator = function(name, validator){
	if( typeof validator == 'function' ) validator = {test: validator};
	validator.name = name;
	this.validators.push(validator);
};

Table.addValidator('match', function(key, value, match){ return match.call(this, value); });
Table.addValidator('pattern', function(key, value, pattern){ console.colorAll('pattern', pattern); return pattern.test(value); });
Table.addValidator('min', function(key, value, min){ return value >= min; });
Table.addValidator('max', function(key, value, max){ return value <= max; });
Table.addValidator('unique', Table.isFree);
Table.addValidator('ref', {
	async: true,
	// je vérifie que la référenc existe
	test: function(key, value, ref, callback){
		DB.getTable(ref).read(function(error){ callback(error ? error : !this.isFree('id', value)); });
	}
});
Table.addValidator('notnull', {
	testnull: true,
	test: function(key, value){ return value !== null; }
});

Table.implement({
	getRule: function(key, name){
		var rules = this.schema.rules;

		switch(arguments.length){
		case 0:
			return rules;
		case 1:
			return rules[key] || null;
		case 2:
			rules = rules[key];
			return rules ? (rules[name] || null) : null;
		}

		return null;
	},

	hasRule: function(key, name){
		switch(arguments.length){
		case 0:
			return Boolean(this.getRule());
		case 1:
			return Boolean(this.getRule(key));
		case 2:
			var rules = this.getRule(key);
			return rules && name in rules;
		}

		return false;
	},

	// retourne la valeur par défaut pour le champ key ou undefined
	getDefault: function(key){
		var value = this.getRule(key, 'default');
		if( typeof value == 'function' ) value = value.call(this);
		return value;
	},

	// compare valuea avec valueb sachant que les valeurs proviennent de key
	compare: function(key, valuea, valueb){
		return this.identic(valuea, valueb);
	},

	// retourne si a == b
	identic: function(a,b){
		if( this.schema.caseSensitive ){
			return String(a) == String(b);
		}
		return String(a).toLowerCase() == String(b).toLowerCase();
	},

	// retourne value telle qu'elle seras inscrite dans la BDD
	encode: function(key, value){
		if( this.hasRule(key) ){
			var setters = this.constructor.setters, name;

			if( value === null && this.hasRule(key, 'default') ) value = this.getDefault(key);
			if( value != null && this.hasRule(key, 'type') ){
				var type = this.getRule(key, 'type');

				if( !Object.is(value, type) ){
					try{
						value = Object.cast(value, type);
					}
					catch(e){
						throw e;
					}
				}
			}

			for(name in setters){
				if( this.hasRule(key, name) ){
					value = setters[name].call(this, value, this.getRule(key, name));
				}
			}
		}

		return value;
	},

	// retourne value telle qu'elle est utilisée hors BDD
	decode: function(key, value){
		if( this.hasRule(key) ){
			var getters = this.constructor.getters, name;
			for(name in getters){
				if( this.hasRule(key, name) ){
					value = getters[name].call(this, value, this.getRule(key, name));
				}
			}
		}

		return value;
	},

	// value est t-'elle une valeur valide pour key
	isValid: function(key, value, callback){
		var self = this, validators = this.constructor.validators, validator, i = 0, j = validators.length;

		function nextValidator(){
			if( i < j ){
				validator = validators[i++];

				if( !self.hasRule(key, validator.name) ){
					nextValidator();
				}
				else if( value === null && !validator.testnull ){
					nextValidator();
				}
				else if( validator.async ){
					validator.test.call(self, key, value, self.getRule(key, validator.name), validate);
				}
				else{
					validate(validator.test.call(self, key, value, self.getRule(key, validator.name)));
				}
			}
			else{
				callback.call(self);
			}
		}

		function validate(valid){
			if( valid instanceof Error || !valid ){
				var error = {type: 'validation', key: key, value: value, validator: validator.name, validatorValue: self.getRule(key, validator.name)};
				if( valid instanceof Error ) error.error = valid;
				callback.call(self, error);
			}
			else{
				nextValidator();
			}
		}

		nextValidator();
	},

	// retourne si item correspond en tout point au schéma de cette table
	// le callback retoune une erreur qui permet de savoir quelle clé ne match pas et pour quelle raison
	matchRules: function(item, callback){
		var keys = Object.keys(item), key, value, matchError, i = 0, j = keys.length, count = 0;

		function addError(data){
			if( !matchError ){
				matchError = new Error('Validation error');
				matchError.type = 'validation';
				matchError.errors = [];
			}
			matchError.errors.push(data);
		}

		function next(error){
			if( error ) addError(error);

			count++;
			if( count == j ){
				callback.call(this, matchError);
			}
		}

		for(;i<j;i++){
			key = keys[i];
			value = item[key];

			try{
				value = item[key] = this.encode(key, value);
			}
			catch(error){
				next(error);
				continue;
			}

			this.isValid(key, value, next);
		}
	}
});

/*
---

name: reference

description: permet qu'un objet puisse faire référence à un autre

...
*/

Table.implement({
	preserveReference: function(action, id, newid, callback){
		var self = this, references = this.references, i = 0, j = references.length, reference, key, table;

		function nextTable(){
			if( i < j ){
				reference = references[i++];
				key = reference.key;
				table = DB.getTable(reference.table);

				if( (action == 'remove' || action == 'removeAll') && table.getRule(key, 'ONREMOVE') == 'SETNULL' ){
					if( action == 'remove' ){
						action = 'update';
						newid = null;
					}
					else{
						action = 'updateAll';
						newid = null;
					}
				}

				switch(action){
				// met la nouvelle valeur pour les entrées faisant référence à cet id
				case 'update':
					var prop = {};

					prop[key] = newid;

					table.updateAll(
						function(item){ return item[key] == id; },
						prop,
						result
					);
					break;
				case 'updateAll':
					table.read(function(error, items){
						if( error ) return result(error);

						table.watchChanges();

						var i = 0, j = items.length;
						for(;i<j;i++){
							var index = id.indexOf(items[i][key]);
							if( index !== -1 ){
								items[i][key] = newid ? newid[index] : null;
								table.exec('replaceLine', i, table.stringify(items[i]), items[i]);
							}
						}

						// applyChanges appeleras result
						table.callback = result;
						table.applyChanges();
					});
					break;
					// supprime les entrées faisant référence à cet id
				case 'remove':
					table.removeAll(
						function(item){ return item[key] == id; },
						result
					);
					break;
				case 'removeAll':
					table.removeAll(
						function(item){ return id.contains(item[key]); },
						result
					);
					break;
				}
			}
			else{
				callback.call(self);
			}
		}

		function result(error){
			if( error ) callback.call(self, error);
			else nextTable();
		}

		nextTable();
	},

	updateReferences: function(id, newid, callback){
		this.preserveReference('update', id, newid, callback);
	},

	updateAllReferences: function(ids, newids, callback){
		this.preserveReference('updateAll', ids, newids, callback);
	},

	removeReferences: function(id, callback){
		this.preserveReference('remove', id, null, callback);
	},

	removeAllReferences: function(ids, callback){
		this.preserveReference('removeAll', ids, null, callback);
	}
});

DB.Table = Table;

module.exports = DB;
