describe('Filter tests', function() {

	describe('RegExp filtering', function(){

		it('a regexp filter is regexp.test function', function() {

			var regexp = /[a-z]+/;

			expect(regexp.toFilter()).toBe(regexp.test);

		});

	});

	describe('String filtering', function(){

		it('should return true for the string name:damien and the item {name: "damien"}', function() {

			var filter = 'name:damien'.toFilter();
			var item = {name: 'damien'};

			expect(filter(item)).toBe(true);

		});

	});

});
