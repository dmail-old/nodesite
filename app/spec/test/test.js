describe('Test group', function() {

	describe('First test', function(){

		it('should be equal to 3', function() {

			expect(3).toBe(3);

		});
	});

	describe('Second test', function(){

		it('Object.prototype.extend', function() {

			expect(typeof Object.prototype.extend).toBe("function");

		});
	});

});
