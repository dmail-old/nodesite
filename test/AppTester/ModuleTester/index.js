/*

sur un restart module pas besoin de recréer les series puisque le module n'exporte plus la même chose

*/

var util = require('../util');
var TestSerie = require('../TestSerie');

var ModuleTester = util.extend(TestSerie, {
	TestSerie: TestSerie,
	type: 'moduleTester',
	testPaths: null,
	isWatching: true, // watch for module change and auto runs all tests when it happens

	init: function(path, testPaths){
		this.path = path;
		this.testPaths = testPaths;		
		this.setupModule();
		this.watch();
	},

	// don't watch testFiles
	watchFilter: function(path){
		return this.testPaths.indexOf(path) === -1;
	},

	getSerie: function(){
		return [].concat(this.testPaths);
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

	setupModule: function(){
		if( this.module === null ){
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
		}

		this.level = this.getDependencyLevel();
	},

	setupSerie: function(path){
		this.setupModule();
		this.imports = this.createImports();
	},

	tearDownSerie: function(){
		delete require.cache[this.path];
		this.module = null;
		this.imports = null;
	},

	getDependencyLevel: function(){
		
		function dependencyLevel(module){
			var level = 0, children = module.children, i = 0, j = children.length, child, childLevel;

			if( j ){
				for(;i<j;i++){
					child = children[i];
					childLevel = dependencyLevel(child);
					level = Math.max(level, childLevel);
				}

				level++;
			}

			return level;
		}

		return dependencyLevel(this.module);		
	},

	toString: function(){
		return this.path.replace(global.APP_PATH, '').slice(1);
	}
});

module.exports = ModuleTester;