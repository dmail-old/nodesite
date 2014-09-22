var TestCollector = {
	Test: require('Test'),

	createTest: function(name, fn){
		return this.Test.new(name, fn);
	},

	collect: function(object){
		var tests = [], key;

		for(key in object){
			tests.push(this.createTest(key, object[key]));
		}

		return this.tests;
	}
};