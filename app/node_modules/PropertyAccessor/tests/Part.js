testModule('objectPath/pathPart', function(PathPart){

	var part = PathPart.new('name');
	
	it('has the property name', function(){
		part.setModel({
			name: 'damien'
		});

		expect(part.has()).toBe(true);
	});
	
	it('get the model name damien', function(){
		part.setModel({
			name: 'damien'
		});

		expect(part.get()).toBe('damien');
	});

	it('set the model name', function(){		
		part.setModel({
			name: 'damien'
		});

		part.set('sandra');
		expect(part.get()).toBe('sandra');
	});

	it('propagate model change to nextPart', function(){

		part.nextPart = PathPart.new('firstName');
		part.setModel({
			name: {
				firstName: 'damien'
			}
		});

		expect(part.nextPart.get()).toBe('damien');

	});	

});