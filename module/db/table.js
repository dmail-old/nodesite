var JSONFilePartManager = require('../module/filePartManager/jsonFilePartManager.js');
var JSONFilePart = require('../module/filePartManager/jsonFilePart.js');

var TableRecord = JSONFilePart.extend({

});

var Table = JSONFilePartManager.extend({
	dirPath: './',
	name: null,
	partConstructor: TableRecord,

	create: function(name){
		if( typeof name != 'string' ){
			throw new TypeError('string expected for table name');
		}

		this.name = name;
		return JSONFilePartManager.create(this.dirPath + this.name);
	},

	noop: function(callback, bind){
		return this.reply(callback, bind, null, 0);
	},

	compare: function(key, a, b){
		return a === b;
	},

	updatePart: function(part, fields, callback, bind){
		var item = part.item, key, changed, oldValue, value;

		changed = false;
		for(key in fields){
			oldValue = item[key];
			value = fields[key];

			if( this.compare(key, oldValue, value) ) continue;
			
			this.emit('change', key, oldValue, value);
			item[key] = value;
			changed = true;
		}

		if( changed ){
			var newPart = this.newPart(item);
			return this.replacePart(part, newPart, callback, bind);
		}

		return this.noop(callback, bind);
	},

	findPart: function(selector){
		var parts = this.parts, i = 0, j = parts.length, part, found = null;
		var filter = NS.Filter.toFilter(selector);

		for(;i<j;i++){
			part = parts[i];
			if( filter.call(this, part.item, i, part) === true ){
				found = part.item;
				break;
			}
		}

		return found;
	},

	callWhenReady: function(fn){
		/*

		call fn when this file is ready (opened and readed)

		if state == closed, listen to open event then open();
		if state == opening, listen to open event
		if state == opened listen to read event then read();
		if state == reading listen to read event
		if state == readed call fn on nextTick
		if state == writing listen to write event
		if state == closing listen to close event

		*/

		function callback(error){
			if( error ){
				return fn.call(this, error);
			}
			this.callWhenReaded(fn);
		}

		if( this.state == 'closed' || this.state == 'opening' ){
			this.on('open', callback);

			if( this.state == 'closed' ){
				this.open(function(){});
			}
		}
		else if( this.state == 'opened' || this.state == 'reading' ){
			this.on('read', callback);

			if( this.state == 'opened' ){
				this.read(function(){});
			}			
		}
		else if( this.state == 'readed' ){
			process.nextTick(fn.bind(this));
		}
		else if( this.state == 'writing' ){
			this.on('write', callback);
		}
		else if( this.state == 'closing' ){
			this.on('close', callback);
		}
	},

	find: function(selector, callback, bind){
		this.callWhenReady(function(error){
			if( error ){
				return this.reply(callback, bind, error);
			}
			var part = this.findPart(selector);
			return this.reply(callback, bind, null, part);
		});
	},

	insert: function(fields, callback, bind){
		// faut checker fields genre est ce que ça existe et tout auto rajouter un id etc
		// ce qui suppose de lire open et tout
		// mais bon ça c'est que si schéma l'impose
		// pour le moment on considère que c'est bon

		if( typeof fields != 'object' ){
			return this.reply(callback, bind, new Error('record fields must be an object'));
		}

		var part = this.newPart(fields);
		return this.appendPart(part, callback, bind);
	},

	update: function(selector, fields, callback, bind){
		this.find(selector, function(error, part){
			if( error ){
				return this.reply(callback, bind, error);
			}
			if( part ){
				return this.updatePart(part, callback, bind);
			}

			this.noop(callback, bind);
		});
	},

	remove: function(selector, callback, bind){
		this.find(selector, function(error, part){
			if( error ){
				return this.reply(callback, bind, error);
			}
			if( part ){
				return this.removePart(part, callback, bind);
			}

			this.noop(callback, bind);
		});
	},

	findAll: function(selector, callback, bind){

	},

	updateAll: function(selector, fields, callback, bind){

	},

	removeAll: function(selector, callback, bind){

	},

	drop: JSONFilePartManager.unlink
});

module.exports = Table;