var util = require('../util');
var TestSerie = require('../TestSerie');

var ModuleTester = util.extend(TestSerie, {
	TestSerie: TestSerie,
	type: 'moduleTester',
	testPaths: null,
	level: null,
	isWatching: true, // watch for module change and auto runs all tests when it happens

	init: function(path, testPaths){
		this.path = path;
		this.testPaths = testPaths;
		this.watch();
	},

	// don't watch testFiles
	watchFilter: function(path){
		return this.testPaths.indexOf(path) === -1;
	},

	getSerie: function(){
		return this.testPaths;
	},

	createTest: function(path){
		return util.new(this.TestSerie, path, this);
	},

	clearCache: function(){
		for(var key in require.cache){
			delete require.cache[key];
		}
	},

	createImports: function(){
		return util.clone(this.module.exports);
	},

	setupSerie: function(path){
		/*
		il faut supprimer tous les modules qui ont été require par celui-ci
		ou alors il faudrais les recenser mais partons là dessus pour le moment
		il faut emptyCache parce que sinon les appels à require dans le modules
		sont ignorés, ils sont récup depuis le cache
		du coup on peut penser, à tort, qu'un module n'a pas de dépendence
		*/
		this.clearCache();

		require(this.path); // can throw errors
		this.module = require.cache[this.path];
		this.imports = this.createImports();
	},

	tearDownSerie: function(){
		delete require.cache[this.path];
		this.module = null;
		this.imports = null;
	},

	get children(){
		return this.module.children;
	},

	get parent(){
		return this.module.parent;
	},

	get dependencyLevel(){
		if( typeof this.level === 'number' ) return this.level;
		this.level = this.getDependencyLevel();
	},

	getDependencyLevel: function(){
		var level = 0, children = this.children, i = 0, j = children.length, child, childLevel;

		if( j ){
			for(;i<j;i++){
				child = children[i];
				childLevel = this.getDependencyLevel.call(child);
				level = Math.max(level, childLevel);
			}

			level++;
		}

		return level;
	},

	toString: function(){
		return this.path.replace(global.APP_PATH, '').slice(1);
	}
});