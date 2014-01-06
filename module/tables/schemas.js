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
// renommmer regexp
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