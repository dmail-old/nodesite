/*

Un testgroup par module

*/

var util = require('../util');
var TestSerie = require('../TestSerie');

var TestGroup = util.extend(TestSerie, {
	Test: TestSerie,
	name: 'Anonymous testGroup',
	_name: 'testGroup',	
	isCollectingFails: false
});

module.exports = TestGroup;