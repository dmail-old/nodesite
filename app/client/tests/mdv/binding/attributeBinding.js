testModule('mdv/binding/attributeBinding', function(AttributeBinding){

	it('bind node attribute to a model', function(){

		var node = document.createElement('div'), model = {firstName: 'damien'};
		var binding = AttributeBinding.new(node, 'name', model, 'firstName');

		expect(node.getAttribute('name')).toBe('damien');
		model.firstName = 'sandra';
		expect(node.getAttribute('name')).toBe('sandra');
	});

	it('support conditinal attribute', function(){

		var node = document.createElement('div'), model = {firstName: 'damien'};
		var binding = AttributeBinding.new(node, 'name?', model, 'firstName');

		expect(node.hasAttribute('name')).toBe(true);
		model.firstName = null;
		expect(node.hasAttribute('name')).toBe(false);
	});

});