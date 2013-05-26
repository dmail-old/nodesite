var FS = require('fs');

var Watcher = {
	listeners: {},
	watchers: {},
	
	watchFile: function(path, callback){
		var stack = this.listeners[path];
		
		if( !stack ){
			this.listeners[path] = [callback];
			this.watchers[path] = this.createWatcher(path, this.change.bind(this, path));
		}
		else if( stack.indexOf(callback) === -1 ){
			stack.push(callback);
		}
	},
	
	unwatchFile: function(path, callback){
		var callbacks = this.listeners[path];
		
		if( callbacks ){
			if( callback ){
				var index = callbacks.indexOf(callback);
				if( index ){
					callbacks.splice(index, 1);
				}
			}
			
			if( !callback || callbacks.length == 0 ){
				delete this.listeners[path];
				this.destroyWatcher(path);
			}
		}
	},
	
	createWatcher: function(path, callback){
		var previous = +new Date() - 100;
		
		return FS.watch(path, {persistent: false}, function(){
			if( (+new Date()) - previous > 100 ){
				callback();
				previous = +new Date();
			}
		});
	},
	
	destroyWatcher: function(path){
		var watcher = this.watchers[path];
		if( watcher ) watcher.close();
	},
	
	change: function(path){
		var listeners = this.listeners[path], i = 0, j = listeners.length;
		for(;i<j;i++){
			listeners[i](path);
		}
	},
	
	watch: function(path, callback, nodirectory){
		if( !FS.existsSync(path) ){
			console.warn(path, 'n\'existe pas');
			return;
		}
		
		var stat = FS.statSync(path);
		if( stat.isDirectory() ){
			if( nodirectory ) return;
			
			var files = FS.readdirSync(path);
			
			// le chemin du fichier faut que je rajoute le chemin du dossier devant realPath ou path.resolve()?	
			files.forEach(function(name){ this.watch(path + '/' + name, callback, true); }, this);
			return;
		}
		
		this.watchFile(path, callback);
	},
	
	watchAll: function(paths, callback){
		paths.forEach(function(path){ this.watch(path, callback); }, this); 
	}
};

module.exports = Watcher;