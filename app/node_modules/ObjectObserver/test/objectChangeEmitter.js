testModule('objectObserver/objectChangeEmitter', function(ObjectChangeEmitter){

	it('should return the same instance for same object', function(){
		var object1 = {};

		expect(ObjectChangeEmitter.new(object1)).toBe(ObjectChangeEmitter.new(object1));
	});

	it('should emit a name event when name property is set', function(){
		
		var object1 = {};
		var emitter = ObjectChangeEmitter.new(object1);

		emitter.on('name', function(name, oldValue, value){
			expect(name).toBe('name');
			expect(oldValue).toBe(undefined);
			expect(value).toBe('damien');
		});

		object1.name = 'damien';
	});

	it('should not emit event when value is the same', function(){

		var object1 = {};
		var emitter = ObjectChangeEmitter.new(object1);
		var called = false;

		object1.name = null;

		emitter.on('name', function(name, oldValue, value){
			called = true;
		});

		object1.name = null;

		expect(called).toBe(false);

	});

});