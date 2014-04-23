testModule('selector/nullSelector', function(NullSelector){

	it('match nothing', function(){
		var selector = NullSelector.new();

		expect(selector.match(true)).toBe(false);
		expect(selector.match(false)).toBe(false);
		expect(selector.match(null)).toBe(false);
	});

});