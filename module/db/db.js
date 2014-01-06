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
seul unique et ref resteront coté BDD (même pas)

- faire quelque chose de souple et clair pour répondre aux demandes
créer une class request et response?

*/

var FS = require('fs');
require('./types.js');

var DB = {
	schemas: require('./schemas.js'),
	tables: {},

	start: function(){
		var table, tables = this.tables, rules, key;

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
			table = this.tables[name] = Table.new(name);
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

var Table = {
	name: null,

	create: function(name){
		this.schema = Object.merge({}, DB.schemas.default, DB.schemas[name] || {});

		this.references = [];
		this.modifiedReferences = {};
		this.removedReferences = [];

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

	update: function(){
		/*
		this.matchRules(properties, function(error){
			if( error ) return this.error(error);

			this.watchChanges();
			this.match(match, function(item, index){
				this.updateLine(index, properties);
			});
			this.applyChanges();
		});
		*/
	},

	updateAll: function(){
		/*
		this.matchRules(properties, function(error){
			if( error ) return this.error(error);

			this.watchChanges();
			this.matchAll(match, function(item, index){
				this.updateLine(index, properties);
			});
			this.applyChanges();
		});
		*/
	},

	insert: function(){
		/*var key, rules = this.getRules(), result;

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
		*/
	},

	find: function(){

	},

	remove: function(){

	}
};

/*
préserve les références
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
*/

module.exports = DB;
