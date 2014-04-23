testModule('selector/regExpSelector', function(RegExpSelector){

	it('test the regexp on the supplied value', function(){
		var selector = RegExpSelector.new(/[a-z]/);

		expect(selector.match(0)).toBe(false);
		expect(selector.match('b')).toBe(true);
	});
	
});