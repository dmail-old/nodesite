/*

faudrais un event restart ou change

*/

var util = require('../util');
var TestModel = require('../TestModel');

var TestSerie = util.extend(TestModel, {
	Watcher: require('../../../node_modules/watcher'),
	Test: require('../Test'),
	type: 'testSerie',
	name: 'Anonymous testSerie',
	isWatching: true, // watch for test change and rerun the test when file is changed
	path: null,
	moduleTester: null,
	module: null,
	imports: null,
	failedCount: null,
	endsOnFailure: true, // the serie ends when a test fails
	serie: null, // array of test	

	init: function(path, moduleTester){
		this.path = path;
		this.moduleTester = moduleTester;
		this.module = this.moduleTester.module;
		this.imports = this.moduleTester.imports;
		this.watch();
	},

	watch: function(){
		if( this.isWatching ){
			this.Watcher.watch(this.path, this.change.bind(this), this.watchFilter.bind(this));
		}
	},

	change: function(){
		this.emit('change');
		this.begin();
	},

	watchFilter: function(){
		return true;
	},

	getSerie: function(){
		// tests com from module.exports
		return Object.keys(this.exports);
	},

	setupSerie: function(){
		global.imports = this.imports;
		this.exports = require(this.path);
	},

	tearDownSerie: function(){
		global.imports = null;
		delete require.cache[this.path];
		this.exports = null;
	},

	setup: function(){
		this.setupSerie();
		this.serie = this.getSerie();
		this.failedCount = 0;
		this.index = 0;
		this.current = null;
	},

	teardown: function(){
		// something to do?
	},

	clean: function(){
		this.tearDownSerie();
		if( this.current ){
			this.current.close();
			this.current = null;
		}	
		this.serie = null;
	},

	createTest: function(name){
		return util.new(this.Test, name, this.exports[name], this);
	},

	next: function(){
		if( this.index >= this.serie.length ){
			return null;
		}
		else{
			this.current = this.createTest(this.serie[this.index]);
			this.current.handler = this;
			this.index++;
			return this.current;
		}
	},

	nextTest: function(){
		if( this.next() ){
			this.current.test();
		}
		// all test passed with success or no test to run
		else{
			this.pass();
		}
	},

	handleEvent: function(e){
		if( e.type == 'test-end' ){
			if( e.target.failed ){
				this.failedCount++;
			}

			if( this.failedCount && this.endsOnFailure ){
				this.fail();
			}
			else{
				this.nextTest();
			}
		}

		TestModel.handleEvent.call(this, e);
	},

	test: function(){
		this.nextTest();
	}
});

module.exports = TestSerie;