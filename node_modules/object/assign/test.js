exports['assign call setter/getter'] = function(test, assign){
	var object = {
		set foo(value){
			this.bar = value;
		},

		get foo(){
			return this.bar;
		}
	};

	assign(object, {
		foo: 'hey'
	});

	test.equal(object.bar, 'hey');
};

exports['noop for non object args'] = function(test, assign){
	assign({}, null);
};