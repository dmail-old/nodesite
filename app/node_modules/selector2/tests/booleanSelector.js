testModule('selector/booleanSelector', function(BooleanSelector){

	it('match anything for true', function(){
		var selector = BooleanSelector.new(true);

		expect(selector.match(true)).toBe(true);
		expect(selector.match(false)).toBe(true);
		expect(selector.match(null)).toBe(true);
		expect(selector.match(undefined)).toBe(true);
	});

	it('match nothing for false', function(){
		var selector = BooleanSelector.new(false);

		expect(selector.match(true)).toBe(false);
		expect(selector.match(false)).toBe(false);
		expect(selector.match(null)).toBe(false);
		expect(selector.match(undefined)).toBe(false);
	});

});