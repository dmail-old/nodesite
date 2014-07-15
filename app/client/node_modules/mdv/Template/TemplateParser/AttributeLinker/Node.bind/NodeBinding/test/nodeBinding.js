testModule('mdv/binding/nodeBinding', function(NodeBinding){

	it('should keep node attribute in sync with a model property', function(){
		var node = document.createElement('div');
		var model = {color: 'red'};
		var binding = NodeBinding.new(node, 'test', model, 'color');

		expect(node.test).toBe('red');
		model.color = 'blue';
		expect(node.test).toBe('blue');
	});

});
