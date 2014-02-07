
var EventEmitter = require('events').EventEmitter;

var Test = new Class({
	path: root + '/dataline.txt',
	
	running: [],
	actions: {
		open: function(callback){
			FS.open(this.path, 'r+', callback);
		},
		close: function(callback){
			FS.close(this.fd, callback);
		}
	},
	cached: {
		open: function(callback){
			return typeof this.fd != 'undefined' ? [this.fd] : null;
		},
		close: function(){
			return typeof this.fd == 'undefined' ? [] : null;
		}
	},
	before: {
		open: function(fd){
			this.fd = fd;
		},
		close: function(){
			delete this.fd;
		}
	},
	stack: [],
	
	isRunning: function(action){
		return this.running.contains(action);
	},
	
	exec: function(action){
		this.running.push(action);
		
		var cached = this.cached[action];
		if( cached ){
			var cache = cached.call(this);
			if( cache ){
				this.end.apply(this, [action, null].concat(cache));
				return;
			}
		}
		
		this.actions[action].call(this, this.end.bind(this, action));
	},
	
	end: function(action, error){
		this.running.remove(action);
		
		if( error ){
			this.stack = [];
			throw error;
			return;
		}
		
		var before = this.before[action];
		if( before ) before.call(this);
		this.emit.apply(this, [action].concat(toArray(arguments, 2)));
		
		var next = this.stack.shift();
		if( next ){
			this.demand(next[0], next[1]);
		}
	},
	
	demand: function(action, callback){		
		if( !this.running.length ){
			this.once(action, callback);
			this.exec(action);
		}
		else if( this.isRunning(action) ){
			this.once(action, callback);
		}
		else{
			this.stack.push([action, callback]);
		}
	},
	
	open: function(callback){
		this.demand('open', callback);
	},
	
	close: function(callback){
		this.demand('close', callback);
	}
}, EventEmitter);

var test = new Test();

test.open(function(fd){
	console.log('fichier ouvert 1', fd);
});
test.open(function(fd){
	console.log('fichier ouvert 2', fd);
});

test.close(function(){
	console.log('le fichier a été fermé');
});