testModule('objectObserver/partObserver', function(PartObserver){

	it('should emit a new change when listenChange is called', function(){
		var part = PartObserver.new('name'), lastChange = null;
		part.listenChange(function(change){
			lastChange = change;
		});
		expect(lastChange.type).toBe('new');
		expect(lastChange.value).toBe(undefined);
		expect(lastChange.model).toBe(null);
	});

	it('got a new change type', function(){
		var part = PartObserver.new('name');
		part.setModel({name: 'damien'});
		expect(part.lastChange.type).toBe('new');
	});

	it('got a deleted change type', function(){
		var part = PartObserver.new('name');
		part.setModel({name: 'damien'});
		part.unsetModel();
		expect(part.lastChange.type).toBe('deleted');
	});

	it('got an updated change type', function(){
		var part = PartObserver.new('name');
		part.setModel({name: 'damien'});
		part.model.name = 'sandra';
		expect(part.lastChange.type).toBe('updated');
	});

	it('get an updated change for different model and different value', function(){
		var part = PartObserver.new('name');
		part.setModel({name: 'damien'});
		part.setModel({name: 'sandra'});
		expect(part.lastChange.type).toBe('updated');
	});

	it('ignore a change for different model but same value', function(){
		var part = PartObserver.new('name');
		part.setModel({name: 'damien'});
		var change = part.lastChange;
		part.setModel({name: 'damien'});
		expect(change).toBe(part.lastChange);
	});
	
});