testModule('selector/stringSelector', function(StringSelector){

	it('match damien name on object', function(){
		var selector = StringSelector.new('damien');

		expect(selector.match('dam')).toBe(false);
		expect(selector.match('damien')).toBe(false);
		expect(selector.match({name: 'damien'})).toBe(true);
	});
	
});