var Check = {
	name: 'Anonymous check',
	_name: 'check',
	beginTime: null,
	endTime: null,
	timeout: null,
	failed: false,
	checked: false,
	lastError: null,
	listener: null,
	bind: null,
	parent: null,

	init: function(name, check){
		if( typeof name == 'string' ) this.name = name;
		if( arguments.length > 1 ){
			if( typeof test != 'function' ) throw new TypeError('test must be a function');
			this.check = check;
		}
	},

	emit: function(name){
		this.listeners[name].call(this.bind, this);
	},

	setup: function(){
		// nooop
	},

	teardown: function(){
		// noop
	},

	check: function(){
		this.fail();
	},

	ontimeout: function(){
		this.timer = null;
		var error = new Error('check takes too long');
		error.code = 'CHECK_TIMEOUT';
		this.error(error);
	},

	begin: function(){
		this.emit(this._name + '-begin');

		this.failed = false;
		this.lastError = null;

		if( typeof this.timeout == 'number' ){
			this.timer = setTimeout(this.ontimeout.bind(this), this.timeout);
		}

		this.setup();

		try{
			this.check(this);
		}
		catch(e){
			this.error(e);
		}
	},

	onend: function(){
		this.teardown();
		this.emit(this._name + '-end');
	},

	end: function(isFailed){
		this.endTime = new Date().getTime();
		this.checked = true;

		if( this.timer != null ){
			clearTimeout(this.timer);
			this.timer = null;
		}

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

module.exports = Check;