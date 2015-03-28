exports['define redefine property not calling getter/setter'] = function(test, define){
	var object = {
		set foo(value){
			this.bar = value;
		},

		get foo(){
			return this.bar;
		}
	};

	define(object, {
		foo: 'hey'
	});

	test.equal(object.foo, 'hey');
	test.equal('bar' in object, false);
};