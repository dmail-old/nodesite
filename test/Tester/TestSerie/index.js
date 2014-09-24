var util = require('../util');
var Check = require('../Check');
var Test = require('../Test');

var TestSerie = util.extend(Check, {
	name: 'Anonymous testSerie',
	_name: 'testSerie',
	timeout: 100,

	Test: Test,
	isCollectingFails: true,
	failedCount: 0,
	serie: null,
	index: null,
	current: null,

	listener: {
		'begin-test': function(){

		},

		'end-test': function(){
			if( this.failed ){
				this.failedCount++;
			}
			this.next();
		}
	},

	init: function(name, serie){
		Check.init.call(this, name);
		if( arguments.length > 1 ){
			if( typeof serie != 'object' ) throw new TypeError('serie must be an array');
			this.serie = serie;
		}
	},

	createTest: function(name, test){
		var array = [this.Test];
		array.push.apply(array, arguments);
		return util.new.apply(util, array);
	},

	addTest: function(test){
		this.serie.push(test);
	},

	put: function(){
		this.addTest(this.createTest.apply(this, arguments));
	},

	setup: function(){
		this.failedCount = 0;
		this.index = 0;
		this.current = null;

		if( !this.hasOwnProperty('module') ){
			// error
		}
		if( !this.hasOwnProperty('imports') ){
			this.imports = this.Test.createImports(this.module);
		}
	},

	prepareTest: function(test){
		test.parent = this;
		test.listener = this.listener;
		test.bind = this;
		test.module = this.module;
		test.imports = this.imports;
	},

	next: function(){
		// a test has failed
		if( this.failedCount && !this.isCollectingFails ){
			this.fail();			
		}
		// all test passed with success
		else if( this.index >= this.length ){
			if( this.failedCount ){
				this.fail();
			}
			else{
				this.pass();
			}
		}
		// check the next test
		else{
			this.current = this[this.index];
			this.index++;
			this.prepareTest(this.current);
			this.current.check();
		}
	},

	begin: function(){
		if( this.serie.length ){
			Check.begin.call(this);
		}
		else{
			this.pass();
		}
	},

	check: function(){
		this.next();
	}
});

module.exports = TestSerie;