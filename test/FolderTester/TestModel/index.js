var util = require('../util');

var TestModel = {
	type: 'testModel',
	name: 'Anonymous testModel',
	state: 'closed',
	beginTime: null,
	endTime: null,
	timeout: null,
	failed: false,
	lastError: null,
	closeOnFailure: false,
	handler: null,

	init: function(name, test){
		if( typeof name == 'string' ) this.name = name;
		if( arguments.length > 1 ){
			if( typeof test != 'function' ) throw new TypeError('test must be a function');
			this.test = test;
		}
	},

	handleEvent: function(){
		if( this.hasOwnProperty('handler') ){
			this.handler.handleEvent(event);
		}
	},

	emit: function(type){
		var event = {
			type: this.type + '-' + type,
			target: this
		};

		this.handleEvent(event);
	},

	// called before calling the test
	setup: function(){
		// noop
	},

	// called when the test has been called
	teardown: function(){
		// noop
	},

	// called when the test is done
	clear: function(){
		// noop
	},

	test: function(){
		this.fail();
	},

	ontimeout: function(){
		this.timer = null;
		var error = new Error('test takes too long');
		error.code = 'TEST_TIMEOUT';
		this.error(error);
	},

	begin: function(){
		if( this.state === 'testing' ){
			this.clear();
		}

		this.emit('begin');

		this.state = 'testing';
		this.lastError = null;

		if( typeof this.timeout == 'number' ){
			this.timer = setTimeout(this.ontimeout.bind(this), this.timeout);
		}

		this.setup();

		try{
			this.test(this);
		}
		catch(e){
			this.error(e);
		}

		this.teardown();
	},

	close: function(){
		this.clearTimer();
		this.clear();
		this.state = 'closed';
		this.emit('close');
	},

	onend: function(){
		this.clear();

		if( this.state != 'closed' ){
			if( this.failed ){
				this.state = this.closeOnFailure ? 'closed' : 'failed';
				if( this.lastError ){
					this.emit('error');
				}
			}
			else{
				this.state = 'passed';
				this.emit('pass');
			}

			this.emit('end');
		}
	},

	clearTimer: function(){
		if( this.timer != null ){
			clearTimeout(this.timer);
			this.timer = null;
		}
	},

	end: function(){
		this.endTime = new Date().getTime();
		this.clearTimer();
		process.nextTick(this.onend.bind(this));
	},

	fail: function(){
		this.failed = true;
		this.end();
	},

	pass: function(){
		this.failed = false;
		this.end();
	},

	error: function(error){
		this.lastError = error;
		this.failed = true;
		this.end();
	},

	get duration(){
		return this.endTime - this.beginTime;
	}
};

module.exports = TestModel;