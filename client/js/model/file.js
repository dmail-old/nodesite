/*
var FileModel = new NS({
	Extends: NodeModel,
	Implements: Model.serverMethods,

	initialize: function(path){
		NodeModel.prototype.initialize.call(this, typeof path == 'string' ? {path: path} : path);
	},

	sync: function(action, callback){
		server.applyAction('filesystem/' + action.name, action.args, callback);
	},

	rename: function(name, callback){
		return this.send('rename', [this.get('path'), name], callback);
	}
});

NodeView.prototype.modelEvents.send = function(){
	// on n'affiche pas le loader tout de suite, uniquement si l'action dure
	this.timeout = setTimeout(function(){
		delete this.timeout;
		this.getDom('li').addItem('loading');
	}.bind(this), 300);
};

NodeView.prototype.modelEvents.complete = function(){
	if( this.timeout ){
		clearTimeout(this.timeout);
		delete this.timeout;
	}
	this.getDom('li').removeItem('loading');
};

var imgA = new FileModel('/img/aa');
imgA.rename('bb');

*/
