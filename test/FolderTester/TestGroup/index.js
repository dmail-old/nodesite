var util = require('../util');
var TestModel = require('../Check');

var TestGroup = util.extend(TestModel, {
	type: 'testGroup',
	name: 'Anonymous testGroup',
	timeout: null,
	closeOnFailure: true,
	failedCount: 0,
	serie: null,
	index: null,
	current: null,

	init: function(name, serie){
		TestModel.init.call(this, name);
		if( arguments.length > 1 ){
			if( typeof serie != 'object' ) throw new TypeError('serie must be an array');
			this.serie = serie;
		}
	},

	handleEvent: function(event){
		TestModel.handleEvent.call(this, event);
		if( event.target == this.current && event.type.slice(-3) == 'end' ){
			this.next();
		}
	},

	setup: function(){
		this.failedCount = 0;
		this.index = 0;
		this.current = null;
	},

	next: function(){
		// a test has failed
		if( this.failedCount && this.closeOnFailure ){
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
			this.current.handler = this;
			this.current.begin();
		}
	},

	begin: function(){
		if( this.serie.length ){
			TestModel.begin.call(this);
		}
		else{
			this.pass();
		}
	},

	test: function(){
		this.next();
	},

	close: function(){
		this.current.close();
		return TestModel.close.call(this);
	}
});

module.exports = TestGroup;