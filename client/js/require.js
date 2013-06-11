window.require = (function(){

	function require(){
		return new Resolver(Array.apply(Array, arguments));
	}

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

	function Resolver(array){
		this.names = array;
		this.dependencies = [];

		if( array.length > 0 && typeof array[array.length -1 ] == 'function' ){
			this.callback = function(){};
		}

		this.next();
	}

	Resolver.prototype.hasNext = function(){
		return this.names.length > 0;
	};

	Resolver.prototype.next = function(){
		if( this.hasNext() ){
			this.current = this.names.shift();
			this.perform(this.current);
		}
		else{
			if( this.callback ) this.callback.apply(window, this.dependencies);
		}
	};

	Resolver.prototype.loadModule = function(name){
		this.path = require.fileURL(name, 'js');

		if( this.path in require.cache ){
			this.onresolve(require.cache[this.path]);
		}
		else{
			require.loadFile(this.path, this.onload.bind(this));
		}
	};

	Resolver.prototype.perform = function(name){

		var self = this;
		window.provide = function(){
			self.provided = Array.apply(Array, arguments);
		};

		this.loadModule(name);
	};

	Resolver.prototype.onload = function(e){
		window.provide = function(){
			throw new Error('provide should be called only once per module');
		};

		var provided = this.provided;
		delete this.provided;

		if( e && e.type == 'error' ){
			throw new Error('error whil loading module');
		}

		if( !provided  ){
			this.onprovide(null);
			//throw new Error('provide not called in the file');
		}
		else if( provided.length == 1 ){
			// provide({}) ou provide(function(){}) on récup direct la valeur
			this.onprovide(provided[0]);
		}
		else{
			// sinon c'est plus complexe, il faut charger les dépendances avant de pouvoir continuer
			var callback = provided.pop();

			provided.push(function(){
				this.onprovide(callback.apply(window, arguments));
			}.bind(this));

			new Resolver(provided);
		}
	};

	Resolver.prototype.onprovide = function(data){
		require.cache[this.path] = data;
		this.onresolve(data);
	};

	Resolver.prototype.onresolve = function(data){
		this.dependencies.push(data);
		this.next();
	};

	require.cache = {};
	//require.Resolver = Resolver;

	return require;

})();
