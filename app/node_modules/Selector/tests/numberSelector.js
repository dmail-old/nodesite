testModule('selector/numberSelector', function(NumberSelector){

	it('match after 3 match call', function(){
		var selector = NumberSelector.new(3);

		expect(selector.match()).toBe(false);
		expect(selector.match()).toBe(false);
		expect(selector.match()).toBe(false);
		expect(selector.match()).toBe(true);
	});
	
});