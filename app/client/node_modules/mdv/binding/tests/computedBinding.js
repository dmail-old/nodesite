testModule('mdv/binding/computedBinding', function(ComputedBinding){

	it('should wait for resolve to call the compute function', function(){
		var arg = null;
		var computed = ComputedBinding.new(function(values){
			arg = values;
		});

		computed.observe('modelName', {}, 'name', true);

		expect(arg).toBe(null);
		computed.resolve();
		expect(typeof arg).toBe('object');
	});

	it('call compute function with an object with values named', function(){

		var arg = null;
		var computed = ComputedBinding.new(function(values){
			arg = values;
		});
		var model = {
			name: 'damien',
			age: 10
		};

		computed.observe('modelName', model, 'name');
		computed.observe('modelAge', model, 'age');

		computed.resolve();
		expect(arg.modelName).toBe('damien');
		expect(arg.modelAge).toBe(10);
	});

	// unobserve et close
	

});