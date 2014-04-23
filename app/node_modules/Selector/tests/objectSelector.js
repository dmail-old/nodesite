testModule('selector/objectSelector', function(ObjectSelector){

	it('match only the object', function(){
		var object = {};
		var selector = ObjectSelector.new(object);

		expect(selector.match({})).toBe(false);
		expect(selector.match(object)).toBe(true);
	});
	
});