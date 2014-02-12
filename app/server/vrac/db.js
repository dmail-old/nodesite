var FS = require('fs');
var Path = require('path');

var DB = {
	path: root + '/server/database',
	tables: {},
	schemas: {},
	
	setSchema: function(table, schema){
		
	},
	
	getSchema: function(table, schema){
		
	},
	
	load: function(callback){
		FS.readdir(this.path + '/table', function(error, files){
			if( error ){
				throw error;
				return;
			}
			
			var i = 0, j = files.length, count = 0;
			function loadTable(error){
				if( error ) return callback(error);
				if( ++count >= j ) callback();
			}		
			
			if( j === 0 ) return callback();
			
			for(;i<j;i++){
				var table = this.createTable(files[i]);
				table.load(loadTable);
			}		
		}.bind(this));
	},
	
	getTable: function(name){
		return this.tables[name];
	},
	
	createTable: function(name){
		return this.tables[name] = new DB.Table(name);
	},
	
	insert: function(name, item, callback){
		var table = this.getTable(name);
		if( !table ){
			return callback(new Error('Cette table n\'existe pas'));
		}
		
		table.insert(item, callback);
	},
	
	insertTable: function(name, callback){
		var table = this.getTable(name);
		if( table ){
			return callback(new Error('Cette table existe déjà'));
		}
		
		table = this.createTable(name);
		table.save(callback);
	}
	
	/*
	query: function(sql, callback){
		
	},
	
	count: function(){
		
	},
	
	find: function(table, fields, end){
		
	},
	
	findAll: function(table, fields, end){
		
	},
	
	add: function(table, fields){
		
	},
	
	replace: function(table, fields){
		
	},
	
	update: function(table, fields){
		
	},
	
	remove: function(table, condition){
		
	}
	*/
};

DB.Table = new Class({
	initialize: function(name){
		this.name = name;
		this.path = DB.path + '/table/' + this.name;
		this.items = [];
	},
	
	load: function(callback){
		FS.readdir(this.path, function(error, files){
			if( error ){
				callback(error);
				return;
			}
			
			var i = 0, j = files.length, count = 0;
			function loadItem(error){
				if( error ) return callback(error);
				if( ++count >= j ) callback();
			}
			
			if( j == 0 ) return callback();
			
			for(;i<j;i++){
				var item = this.createItem(files[i]);
				item.load(loadItem);
			}
		});
	},
	
	save: function(callback){
		FS.mkdir(this.path, 0777, callback);
	},
	
	insert: function(data, callback){
		var item = this.createItem(this.calcIndex());
		item.update(data, callback);
	},
	
	calcIndex: function(){
		var items = this.items, i = items.length, j = i;
		while(i--){
			if( typeof items[i] == 'undefined' ) return i;
		}
		return j;
	},
	
	createItem: function(index){
		var item = new DB.Item(this, index);
		this.items[index] = item;
		return item;
	}
});

DB.Item = new Class({
	initialize: function(table, index){
		this.table = table;
		this.index = index;
		this.path = table.path + '/' + index;
		this.data = {};
	},
	
	load: function(callback){
		FS.readFile(this.path, function(error, data){
			if( error ) return callback(error);
			
			this.data = JSON.parse(data);
			callback();
		}.bind(this));
	},

	update: function(data, callback){
		this.data = data;
		this.save(callback);
	},
	
	save: function(callback){
		FS.writeFile(this.path, JSON.stringify(this.data), callback);
	},
	
	remove: function(callback){
		FS.unlink(this.path, callback);
	}
});

global.DB = DB;