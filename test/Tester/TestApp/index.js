var util = require('../util');
var TestGroup = require('../TestGroup');

var TestApp = util.extend(TestGroup, {
	Test: TestGroup,
	name: 'Anonymous testApp',
	_name: 'testApp',	
	isCollectingFails: false,
});

module.exports = TestApp;