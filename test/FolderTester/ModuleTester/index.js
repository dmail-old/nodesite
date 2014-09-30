var util = require('../util');
var TestModel = require('../TestModel');

var ModuleTester = util.extend(TestModel, {
	type: 'moduleTester',
	path: null,
	testPaths: null,
	module: null,
	imports: null,
	level: null,
	Watcher: require('../../../node_modules/watcher'),
	isWatching: true, // watch for module change and auto runs test
	TestSerie: require('../TestSerie'),
	testGroup: null,

	init: function(path, testPaths){
		this.path = path;
		this.testPaths = testPaths;

		if( this.isWatching ){
			this.Watcher.watch(this.path, this.change.bind(this));
		}
	},

	onchange: function(){
		this.test();
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

	clearCache: function(){
		for(var key in require.cache){
			delete require.cache[key];
		}
	},

	createImports: function(){
		return util.clone(this.module.exports);
	},

	createTestSerie: function(path){
		return util.new(this.TestSerie, path, this);
	},

	setup: function(){
		// il faut supprimer tous les modules qui ont été require par celui-ci
		// ou alors il faudrais les recenser mais partons là dessus pour le moment
		// il faut emptyCache parce que sinon les appels à require dans le modules
		// sont ignorés, ils sont récup depuis le cache
		// du coup on peut penser, à tort, qu'un module n'a pas de dépendence
		this.clearCache();
		require(this.path); // can throw errors
		this.module = require.cache[this.path];

		this.imports = this.createImports();

		var testPaths = this.testPaths, i = 0, j = testPaths.length, testPath, testSerie, testSeries = [];

		for(;i<j;i++){
			testPath = testPaths[i];
			testSerie = this.createTestSerie(testPath);
			testSeries.push(testSerie);
		}
		
		this.testGroup = this.createTestGroup(testSeries);
		this.testGroup.handler = this;
	},

	teardown: function(){
		delete require.cache[this.path];
	},

	clear: function(){
		this.testGroup.close();
		this.testGroup = null;
	},

	test: function(){
		this.testGroup.begin();
	},

	toString: function(){
		return this.path.replace(global.APP_PATH, '').slice(1);
	}
});