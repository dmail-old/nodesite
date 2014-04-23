testModule('selector/index', function(SelectorFactory){

	it('should create a regExpSelector from a regExp argument', function(){
		var RegExpSelector = require('selector/regExpSelector');		
		var selector = SelectorFactory.new(/[a-z]/);

		expect(RegExpSelector.isPrototypeOf(selector)).toBe(true);
	});
	
});