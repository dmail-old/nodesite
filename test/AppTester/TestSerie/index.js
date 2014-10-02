/*

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
	collectFails: false, // the serie end when a test fails
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
		this.restart();
	},

	watchFilter: function(){
		return true;
	},

	setupSerie: function(){
		this.exports = require(this.path);
	},

	tearDownSerie: function(){		
		delete require.cache[this.path];
		this.exports = null;
	},

	getSerie: function(){
		// tests com from module.exports
		return Object.keys(this.exports);
	},

	setup: function(){
		this.setupSerie();
		this.serie = this.getSerie();
		this.failedCount = 0;
		this.index = 0;
		this.current = null;
		this.emit('startSerie');
	},

	teardown: function(){
		// something to do?
	},

	clean: function(){
		this.tearDownSerie();
		if( this.current ){
			this.current.stop();
		}
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
			// en faisant ça je peux récup les tests fait avant
			// cependant lorsque je restart je sais pas pourquoi
			// mais j'apelle pas getSerie
			this.serie[this.index] = this.current;
			this.current.handler = this;
			this.index++;
			return this.current;
		}
	},

	nextTest: function(){
		if( this.next() ){
			this.current.start();
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

			if( this.failedCount && !this.collectFails ){
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