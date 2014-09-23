/*

*/

var util = require('../util');
var CheckList = require('../CheckList');

var Test = {
	name: 'Anonymous Test',
	test: null,
	module: null,
	imports: null,

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

	init: function(name, test){
		this.name = name;
		if( typeof test != 'function' ) throw new TypeError('test must be a function');
		this.test = test;
	},

	expect: function(length){
		this.length = length;
	},

	assert: function(type, args){
		var assertion = {			
			type: type,
			args: args,
			ok: this.assertMethods[type].apply(this, args)
		};

		this[this.index++] = assertion;

		this.checkDone(!assertion.ok);	
	},

	setup: function(){
		if( this.module === null ){
			return this.respond(new Error('The module to test was not set'));
		}

		if( !this.hasOwnProperty('imports') ){
			this.imports = this.createImports(this.module);
		}

		global.imports = this.imports;
	},

	teardown: function(){
		global.imports = null;
	},

	done: function(){
		// the test expecting one simple assertion can write test.done(something, message)
		// it's a shorthand for test.ok(something, message); test.done()
		if( arguments.length > 0 ){
			this.ok.apply(this, arguments);
		}

		// only happens when expect(length) is called and we haven't check length stuff
		if( this.index != this.length ){
			this.end(new Error('Expect' + this.length + 'and got ' + this.index));
		}
		else{	
			this.end();
		}
	},

	createImports: function(module){
		return util.clone(this.module.exports);
	},

	next: function(){
		// noop
	},

	start: function(){
		try{
			this.test.call(this, this);
		}
		catch(e){
			this.end(e);
		}
	}
};

Object.keys(Test.assertMethods).forEach(function(key){
	Test[key] = function(){
		return this.assert(key, arguments);
	};
});

Test = util.extend(CheckList, Test);

module.exports = Test;