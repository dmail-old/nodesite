var proto = require('proto');

exports['create factory for a given product'] = function(test, Factory){
	var product = proto.extend({
		name: 'foo'
	});
	var productFactory = Factory.create(product);
	var p1 = productFactory.create();

	console.log(p1.factory);

	test.equal(p1.name, 'foo');
	test.equal(p1.factory, productFactory);
};


exports['create a factory for a product with plugins'] = function(test, Factory){

};


