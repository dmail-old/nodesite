if( typeof global == 'undefined' ){
	window.global = window;
}

var TestSerie = {
	Test: require('Test'),
	name: null,
	listener: null,
	group: null,
	module: null,
	imports: null,

	init: function(name, tests, listener){
		this.name = name;
		this.tests = tests;
		this.listener = listener;
	},

	createTest: function(name, fn){
		return this.Test.new(name, fn);
	},

	addTest: function(test){
		this.tests.push(test);
	},

	test: function(name, fn){
		return this.addTest(this.createTest(name, fn, this.ontestend, this));
	},

	emit: function(event){
		this.listener['on' + event].apply(this.listener, Array.prototype.slice.call(arguments, 1));
	},

	runTest: function(test){
		test.testSuite = this;
		test.module = this.module;
		test.imports = this.imports;
		this.current = test;
		this.emit('teststart', test);
		test.run(this.nextNest);
	},
	
	nextTest: function(test){
		// un test a échoué
		if( test && test.failedAssertions ){
			this.emit('serieend', this);
		}
		// fin des tests
		else if( this.index >= this.tests.length ){
			this.emit('serieend', this);	
		}
		else{
			this.runTest(this.tests[this.index]);
		}
	},

	get duration(){
		return this.endTime - this.startTime;
	},
	
	run: function(){
		this.emit('seriestart', this);
		this.index = 0;
		this.current = null;

		if( this.tests.length && !this.hasOwnProperty('imports') && this.hasOwnProperty('module') ){
			this.imports = this.Test.createImport(this.module);
		}

		return this.nextTest();
	}
};

module.exports = TestSerie;