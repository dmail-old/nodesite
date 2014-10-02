var util = require('../util');

var TestModel = {
	type: 'testModel',
	name: 'Anonymous testModel',
	state: 'stopped', // stopped, started, ended
	startTime: null,
	endTime: null,
	timeout: null,
	failed: false,
	lastError: null,
	handler: null,

	init: function(name, test){
		if( typeof name == 'string' ) this.name = name;
		if( arguments.length > 1 ){
			if( typeof test != 'function' ) throw new TypeError('test must be a function');
			this.test = test;
		}
	},

	handleEvent: function(e){
		if( this.hasOwnProperty('handler') ){
			this.handler.handleEvent(e);
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

	// called to clean stuff when we want to rerun the tests while it was running
	clean: function(){
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

	start: function(){
		if( this.state == 'started' ){
			this.stop();
		}

		this.emit('start');

		this.state = 'started';
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

	restart: function(){
		this.emit('restart');
		
		if( this.state == 'started' ){
			this.stop();
		}
		else{
			this.clean();
		}

		this.start();
	},

	clearTimer: function(){
		if( this.timer != null ){
			clearTimeout(this.timer);
			this.timer = null;
		}
	},

	// test results are ignored
	stop: function(){
		if( this.state == 'started' ){
			this.state = 'stopped';
			this.emit('stop');
			this.clearTimer();
			this.clean();
		}
	},

	onend: function(){
		this.clean();

		if( this.state == 'ended' ){
			
			if( this.failed ){
				if( this.lastError ){
					this.emit('error');
				}
				else{
					this.emit('fail');
				}
			}
			else{				
				this.emit('pass');
			}

			this.emit('end');
		}
	},

	end: function(){
		if( this.state == 'started' ){
			this.state = 'ended';
			this.endTime = new Date().getTime();
			this.clearTimer();
			process.nextTick(this.onend.bind(this));
		}
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
		return this.endTime - this.startTime;
	}
};

module.exports = TestModel;