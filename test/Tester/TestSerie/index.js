if( typeof global == 'undefined' ){
	window.global = window;
}

var EventEmitter = require('events').EventEmitter;

var TestSerie = {
	Test: require('Test'),
	name: null,
	tests: null,
	renderer: null,
	emitter: null,
	callback: null,
	bind: null,
	index: null,
	current: null,
	group: null,
	module: null,
	imports: null,

	new: function(){
		var a = Object.create(this);
		a.init.appy(a, arguments);
		return a;
	},

	init: function(name, tests, renderer){
		this.name = name;
		this.tests = tests;
		this.renderer = renderer;
		this.emitter = new EventEmitter();
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
		this.emitter.emit.apply(this.emitter, arguments);
		this.renderer['on' + event].apply(this.renderer, Array.prototype.slice.call(arguments, 1));
	},

	on: function(){
		this.emitter.on.apply(this.emitter, arguments);
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
			this.emit('end', this);
		}
		// fin des tests
		else if( this.index >= this.tests.length ){
			this.emit('end', this);	
		}
		else{
			this.runTest(this.tests[this.index]);
		}
	},

	get duration(){
		return this.endTime - this.startTime;
	},
	
	run: function(){
		this.emit('start', this);
		this.index = 0;
		this.current = null;

		if( this.tests.length && !this.hasOwnProperty('imports') && this.hasOwnProperty('module') ){
			this.imports = this.Test.createImport(this.module);
		}

		return this.nextTest();
	}
};

module.exports = TestSerie;