var FS = require('fs');

var Storage = new Class({
	initialize: function(name){
		this.name = name;
		this.path = root + '/server/storage/'+name;
		
		if( !FS.existsSync(this.path) ){
			FS.mkdirSync(this.path, 0777);
		}
	},
	
	getKeyPath: function(key){
		return this.path + '/' + key;
	},
	
	each: function(callback, bind){
		FS.readdir(this.path, function(error, files){
			if( error ){
				throw error;
				return;
			}
			
			var i = 0, j = files.length;
			for(;i<j;i++){
				callback.call(bind, null, files[i]);
			}
		});
	},
	
	clear: function(){
		this.each(function(key){
			this.remove(key);
		}, this);
	},
	
	clearSync: function(){
		this.each(function(key){
			this.removeSync(key);
		}, this);
	},
	
	get: function(key, callback){
		var path = this.getKeyPath(key);
		FS.readFile(path, function(error, data){
			if( error ) return callback(error);
			callback(null, JSON.parse(data));
		});	
	},
	
	getSync: function(key){
		var data = FS.readFileSync(this.getKeyPath(key));
		if( data instanceof Error ) throw data;
		
		return JSON.parse(data);
	},
	
	set: function(key, value, callback){
		if( typeof value != 'string' ) value = JSON.parse(value);
		
		FS.writeFile(this.getKeyPath(key), value, callback);
	},
	
	setSync: function(key, value){
		if( typeof value != 'string' ) value = JSON.parse(value);
		
		FS.writeFileSync(this.getKeyPath(key), value);
	},
	
	remove: function(key){
		FS.unlink(this.getKeyPath(key), callback);
	},
	
	removeSync: function(key){
		return FS.unlinkSync(this.getKeyPath(key));
	}
});

module.exports = Storage;
global.Storage = Storage;