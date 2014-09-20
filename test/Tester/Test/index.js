/*

*/

var Test = {
	name: null,
	test: null,
	callback: null,
	bind: null,
	assertions: null,
	expectedAssertions: null,
	failedAssertions: null,
	startTime: null,
	endTime: null,
	testSuite: null,
	error: null,
	timeout: 100,

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

		'throws': function(fn){

		},

		'doesNotThrow': function(fn){

		}
	},

	new: function(){
		return Object.create(this).init.apply(this, arguments);
	},

	init: function(name, test){
		this.name = name;
		if( typeof test != 'function' ) throw new TypeError('test must be a function');
		this.test = test;
		this.assertions = [];
		this.failedAssertion = 0;
	},

	expect: function(expectedAssertions){
		this.expectedAssertions = expectedAssertions;
	},

	assert: function(type, args){
		var assertion = {
			type: type,
			args: args,
			ok: this.assertMethods[type].apply(this, args)
		};

		if( !assertion.ok ){
			this.failedAssertions++;
		}

		this.assertions.push(assertion);
	},

	respond: function(error){
		this.endTime = new Date().getTime();

		if( this.timer != null ){
			clearTimeout(this.timer);
			this.timer = null;
		}
		if( error ) this.error = error;

		process.nextTick(function(){
			this.callback.call(this.bind, this);
		}.bind(this));
	},

	ontimeout: function(){
		this.timer = null;
		this.respond(new Error('tesst takes too long, forgot to call test.done()?'));
	},

	done: function(){
		// the test expecting one simple assertion can write test.done(something, message)
		// it's a shorthand for test.ok(something, message); test.done()
		if( arguments.length > 0 ){
			this.ok.apply(this, arguments);
		}

		if( typeof this.expectedAssertions == 'number' && this.expectedAssertions != this.assertions.length ){
			this.respond(new Error('Expect' + this.expectedAssertions + 'and got ' + this.assertions.length));
		}
		else{	
			this.respond();
		}
	},

	exec: function(callback, bind){
		this.callback = callback;
		this.bind = bind || this;
		this.startTime = new Date().getTime();
		
		if( typeof this.timeout == 'number' ){
			this.timer = setTimeout(this.ontimeout.bind(this), this.timeout);
		}

		try{
			this.test.call(this, this);
		}
		catch(e){
			this.respond(e);
		}
	}	
};

Object.keys(Test.assertMethods).forEach(function(key){
	Test[key] = function(){
		return this.assert(key, arguments);
	};
});

module.exports = Test;