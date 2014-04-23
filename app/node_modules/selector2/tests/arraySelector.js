testModule('selector/arraySelector', function(ArraySelector){

	it('match nothing for empty array', function(){
		var selector = ArraySelector.new([]);

		expect(selector.match(true)).toBe(false);
		expect(selector.match(false)).toBe(false);
		expect(selector.match(null)).toBe(false);
		expect(selector.match(undefined)).toBe(false);
	});

	it('should match all array values', function(){
		var selector = ArraySelector.new([false, true]);

		expect(selector.match(true)).toBe(false);
		expect(selector.match(false)).toBe(false);
		expect(selector.match(null)).toBe(false);
		expect(selector.match(undefined)).toBe(false);
	});

});