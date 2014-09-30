/*

*/

var util = require('../util');
var TestModel = require('../TestModel');

var Test = util.extend(TestModel, {
	type: 'test',
	name: 'Anonymous test',
	timeout: 100,
	module: null,
	imports: null,
	expectedAssertions: null,
	assertions: null,
	failedCount: null,
	closeOnFailure: true,

	assertMethods: {
		'ok': function(a){
			return Boolean(a);
		},

		'equal': function(a, b){
			return a == b;
		},

		'strictEqual': function(a, b){
			return a === b;
		},

		'typeOf': function(a, b){
			return typeof a === b;
		},

		'protoOf': function(a, b){
			return Object.getPrototypeOf(a) === b;
		},

		'throws': function(fn){
			try{
				fn();
			}
			catch(e){
				return true;
			}
			return false;
		},

		'doesNotThrow': function(fn){
			try{
				fn();
			}
			catch(e){
				return false;
			}
			return true;
		}
	},

	init: function(name, test, testSerie){
		this.name = name;
		this.test = test;
		this.testSerie = testSerie;
		this.imports = testSerie.imports;
		this.module = testSerie.module;
	},

	setup: function(){
		this.assertions = [];
		global.imports = this.imports;
	},

	teardown: function(){
		global.imports = null;
	},

	expect: function(length){
		this.expectedAssertions = length;
	},

	assert: function(type, args){
		if( this.state == 'closed' ) return;

		var assertion = {			
			type: type,
			args: args,
			ok: this.assertMethods[type].apply(this, args)
		};

		this.assertions.push(assertion);

		if( !assertion.ok ){
			this.failedCount++;
			// le test échoue dès qu'une assertion échoue
			if( this.closeOnFailure ){
				this.fail();
			}
		}
	},

	done: function(){
		// the test expecting one simple assertion can write test.done(something, message)
		// it's a shorthand for test.ok(something, message); test.done()
		if( arguments.length > 0 ){
			this.ok.apply(this, arguments);
		}

		// only happens when expect(length) is called and we haven't check length stuff
		if( typeof this.expectedAssertions == 'number' && this.assertions.length != this.expectedAssertions ){
			this.error(new Error('Expect' + this.expectedAssertions + 'and got ' + this.assertions.length));
		}
		else if( this.failedCount ){
			this.fail();
		}
		else{
			this.pass();
		}
	}
});

Object.keys(Test.assertMethods).forEach(function(key){
	Test[key] = function(){
		return this.assert(key, arguments);
	};
});

module.exports = Test;