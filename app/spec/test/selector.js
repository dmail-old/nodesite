describe('Selector tests', function() {

	describe('RegExp selector', function(){

		it('a regexp filter is regexp.test function', function() {

			var regexp = /[a-z]+/;
			var selector = Selector.new(regexp);			

			expect(selector.filter).toBe(regexp.test);

		});

	});

	describe('String filtering', function(){

		it('should return true for the string name:damien and the item {name: "damien"}', function() {

			var selector = Selector.new('name:damien');
			var item = {name: 'damien'};

			expect(selector.match(item)).toBe(true);

		});

	});

});
