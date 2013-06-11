// le problème maintenant c'est quand je fait un require pendant un require
// et pas un provide pendant un require
// paske le prochain provide concerne le précédent require
// hors on perd cette référence puisqu'on crée un nouveau require
// à faire

function DependencyResolver(array){
	this.index = 0;
	this.dependencies = array;

	if( array.length > 0 && typeof array[array.length - 1] == 'function' ){
		this.callback = array.pop();
	}

	this.next();
}

DependencyResolver.prototype.cache = {};

DependencyResolver.prototype.setId = function(id){
	this.id = id;
};

DependencyResolver.prototype.resolve = function(id){
	
};

DependencyResolver.prototype.hasNext = function(){
	return this.index < this.dependencies.length;
};

DependencyResolver.prototype.next = function(){
	if( this.hasNext() ){
		this.setId(this.dependencies[this.index]);
		this.index++;
		this.loadModule(this.id);
	}
	else{
		if( this.callback ) this.callback.apply(window, this.dependencies);
		this.onend();
	}
};

DependencyResolver.prototype.loadModule = function(id){
	if( id in this.cache ){
		this.onresolve(this.cache[id]);
	}
	else{
		this.resolve(id);
	}
};

DependencyResolver.prototype.provide = function(){
	console.log(this.hasNext(), this.callback.toString(), arguments);
	return;

	this.onprovide(arguments[0]);
	/*if( arguments.length === 0 ){
		this.onprovide(null);
	}
	else if( arguments.length === 1 ){
		this.onprovide(arguments[0]);
	}
	else{
		// sinon c'est plus complexe, il faut charger les dépendances avant de pouvoir continuer
		var args = Array.apply(Array, arguments), callback = args.pop();

		args.push(function(){
			if( callback ) this.onprovide(callback.apply(window, arguments));
		}.bind(this));

		new this.constructor(args);
	}
	*/
};

DependencyResolver.prototype.onprovide = function(data){
	this.cache[this.getId()] = data;
	if( this.dependencies ){
		this.onresolve(data);
	}	
};

DependencyResolver.prototype.onresolve = function(data){
	this.dependencies[this.index - 1] = data;
	this.next();
};

DependencyResolver.prototype.onend = function(){
	
};

function require(){
	if( this instanceof require ){
		return DependencyResolver.prototype.constructor.apply(this, arguments);
	}
	else{
		return new require(Array.apply(Array, arguments));
	}
}

require.prototype = Object.create(DependencyResolver.prototype);
require.prototype.constructor = require;
require.prototype.cache = require.cache = {};

require.prototype.setId = function(id){
	// use require.alias here	
	this.id = require.fileURL(id);
};
require.prototype.resolve = function(id){
	require.currentResolver = this;
	require.loadFile(id);
};
require.prototype.onend = function(id){
	require.currentResolver = require.prototype;
};

require.currentResolver = require.prototype;

function provide(){
	require.currentResolver.provide.apply(require.currentResolver, arguments);
}

require.alias = {};

require.config = {
	async: true,
	root: './',
	extension: 'js',
	charset: 'utf8'
};

require.filepath = function(name){
	return require.config.extension + '/' + name + '.' + require.config.extension;
};

require.fileURL = function(name){
	return require.config.root + require.filepath(name, require.config.extension);
};

require.loadFile = function(path, callback){
	var type, element;

	if( path.match(/.js$/) ){
		type = 'js';
		element = document.createElement('script');
		element.type = 'text/javascript';
		element.charset = require.config.charset;
		element.async = require.config.async;
	}
	else if( path.match(/.css$/) ){
		type = 'css';
		element = document.createElement('link');
		element.type = 'text/css';
		element.rel = 'stylesheet';
	}
	else{
		throw new Error('unsupported file extension');
	}

	if( typeof callback == 'function' ){
		element.onerror = callback;
		element.onload = callback;
	}

	document.head.appendChild(element);

	if( type == 'js' ) element.src = path;
	else element.href = path;
};

require.loadFiles = function(names, extension){
	var i = 0, j = names.length, prevExt = require.config.extension, prevAsync = require.config.async;

	require.config.extension = extension;
	require.config.async = false;
	for(;i<j;i++){
		require.loadFile(require.fileURL(names[i]));
	}
	require.config.extension = prevExt;
	require.config.async = prevAsync;

};

require.id = function(id){
	require.currentResolver.setId(id);
};

/*
en écrivant direct comme ça on peut concaténer les fichiers puisque le fichier et ce qu'il provide est
immédiatement stocké

require.id("superdependency");
provide({
	superdependency: true
});

require.id("dependency");
provide('superdependency', function(superdependency){
	superdependency.dependency = true;
	return superdependency;
});

require.id("provide");
provide('superdependency', function(superdependency){
	superdependency.dependency = true;
	return superdependency;
});

require('provide', function(provide){
	console.log(provide);
});




require.id("dependency");
provide({foo: 'bar'});

require.id("module");
require('dependency', function(dependency){
	dependency.more = true;
	provide(dependency);
});

require('module', function(module){
	console.log(module);
});
*/


