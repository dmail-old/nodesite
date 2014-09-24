/*

reste à voir comment propager les events :

begin
end-test
begin-testSerie
end-testSerie
begin-testGroup
end-testGroup
begin-testApp
end-testApp

*/

var util = require('../util');
var Check = require('../Check');

var Test = {
	name: 'Anonymous test',
	_name: 'test',
	timeout: 100,

	module: null,
	imports: null,
	expectedAssertions: null,
	assertions: null,
	failedCount: null,
	isCollectingFails: false,
	closed: true,

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

	createImports: function(module){
		return util.clone(this.module.exports);
	},

	setup: function(){
		this.assertions = [];
		this.closed = false;

		if( this.module === null ){
			return this.end(new Error('The module to test was not set'));
		}

		if( !this.hasOwnProperty('imports') ){
			this.imports = this.createImports(this.module);
		}

		global.imports = this.imports;
	},

	teardown: function(){
		global.imports = null;
	},

	check: function(){
		this.test.call(this, this);
	},

	expect: function(length){
		this.expectedAssertions = length;
	},

	assert: function(type, args){
		if( this.closed === true ) return;

		var assertion = {			
			type: type,
			args: args,
			ok: this.assertMethods[type].apply(this, args)
		};

		this.assertions.push(assertion);

		if( !assertion.ok ){
			this.failedCount++;
			if( !this.isCollectingFails ){
				this.closed = true;
				this.fail();
			}
		}
	},

	done: function(){
		if( this.closed === true ) return;

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
};

Object.keys(Test.assertMethods).forEach(function(key){
	Test[key] = function(){
		return this.assert(key, arguments);
	};
});

Test = util.extend(Check, Test);

module.exports = Test;