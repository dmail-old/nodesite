var TestCollector = {
	Test: require('Test'),
	tests: null,

	new: function(){
		return Object.create(this);
	},

	createTest: function(name, fn){
		return this.Text.new(name, fn);
	},

	ontest: function(name, fn){
		var test = this.createTest(name, fn);
		this.tests.push(test);
	},

	collect: function(){
		this.tests = [];

		global.it = this.ontest.bind(this);
		this.fn.apply(this, arguments);
		global.it = function(){
			throw new Error('it called out of TestSuite.collectTests()');
		};

		return this.tests;
	}
};