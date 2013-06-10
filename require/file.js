/* global Path */

var Watcher = require('./watcher.js');

var File = Item('base').extend('file', {
	constructor: function(path){
		this.setPath(path);
		return this;
	},

	setPath: function(path){
		this.path = Path.resolve(path);
	},

	setPathPart: function(part, value){
		switch(part){
		case 'dirname':
			this.setPath(value + '/' + this.getBasename());
			break;
		case 'basename':
			this.setPath(this.getDirname() + '/' + value);
			break;
		case 'extension':
			if( !value || value === '' ) value = '';
			else if( value.charAt(0) != '.' ) value = '.'+value;

			this.setPath(this.getDirname() + '/' + this.getFilename() + value);
			break;
		case 'filename':
			this.setPath(this.getDirname() + '/' + value + this.getExtension());
			break;
		}
	},

	forceExtension: function(extension){
		if( extension.charAt(0) != '.' ) extension = '.'+extension;
		if( this.getExtension() != extension ) this.setPathPart('extension', extension);
		return this;
	},

	getDirname: function(){
		return Path.dirname(this.path);
	},

	getBasename: function(extension){
		return Path.basename(this.path, extension);
	},

	getExtension: function(){
		return Path.extname(this.path);
	},

	getFilename: function(){
		return this.getBasename(this.getExtension());
	},

	getMimeType: function(){
		return config.getMimeType(this.path);
	},

	watch: function(callback){
		Watcher.watchFile(this.path, callback);
	},

	unwatch: function(callback){
		Watcher.unwatchFile(this.path, callback);
	},

	exists: function(callback){
		FS.exists(this.path, callback);
	},

	existsSync: function(){
		return FS.existsSync(this.path);
	},

	open: function(){
		var args = [this.path].concat(toArray(arguments));
		return FS.open.apply(FS, args);
	},

	openSync: function(){
		var args = [this.path].concat(toArray(arguments));
		return FS.openSync.apply(FS, args);
	},

	truncate: function(fd, len, callback){
		return FS.truncate(fd, len, callback);
	},

	read: function(callback){
		FS.readFile(this.path, callback);
	},

	readSync: function(){
		return FS.readFileSync(this.path);
	},

	readdirSync: function(){
		return FS.readdirSync(this.path);
	},

	readStream: function(){
		return FS.createReadStream(this.path);
	},

	write: function(){
		return FS.write.apply(FS, arguments);
	},

	writeSync: function(){
		return FS.writeSync.apply(FS, arguments);
	},

	closeSync: function(fd){
		return FS.closeSync(fd);
	},

	each: function(callback, bind){
		var files = FS.readdirSync(this.path), i = 0, j = files.length, file;

		for(;i<j;i++){
			file = new File(this.path + '/' + files[i]);
			callback.call(bind, file);
		}
	},

	stat: function(callback){
		FS.stat(this.path, callback);
	},

	statSync: function(){
		var stat;

		try{
			stat = FS.statSync(this.path);
		}
		catch(e){
			return e;
		}

		return stat;
	},

	isFile: function(callback, bind){
		this.exists(function(exists){
			if( !exists ){
				callback.call(bind, false);
				return;
			}
			this.stat(function(error, stat){
				if( error ) throw error;
				callback.call(bind, stat.isFile());
			});
		}.bind(this));
	},

	isFileSync: function(){
		var stat = this.statSync();
		return stat instanceof Error ? false : stat.isFile();
	},

	isDir: function(callback, bind){
		this.stat(function(error, stat){
			if( error ) callback.call(bind, error);
			else callback.call(bind, stat.isDirectory());
		});
	},

	isDirSync: function(){
		var stat = this.statSync();
		return stat instanceof Error ? false : stat.isDirectory();
	},

	getSize: function(callback, bind){
		var stat = this.stat(function(error, stat){
			if( error ) throw error;
			callback.call(bind, stat.size);
		});
	},

	getSizeSync: function(){
		var stat = this.statSync();
		return stat instanceof Error ? stat : stat.size;
	},

	remove: function(callback){
		FS.unlink(this.path, callback);
	},

	removeSync: function(){
		return FS.unlinkSync(this.path);
	}
});

File.cleanPath = function(path){
	// remplace les backslash par des slash
	return path.replace(/\\/g, '/');
};

module.exports = File;
