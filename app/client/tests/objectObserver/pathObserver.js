testModule('objectObserver/pathObserver', function(PathObserver){

	var pathObserver = PathObserver.new('user.comment.title');
	var firstPart = pathObserver.firstPart;
	var lastPart = pathObserver.lastPart;

	it('got a new change type', function(){
		pathObserver.setModel({user: 'damien'});
		expect(firstPart.lastChange.type).toBe('new');
	});

	it('got a deleted change type', function(){
		pathObserver.unsetModel();
		expect(firstPart.lastChange.type).toBe('deleted');
	});

	it('got an updated change type', function(){
		var model = {user: 'damien'};
		pathObserver.setModel(model);
		model.user = 'idir';
		expect(firstPart.lastChange.type).toBe('updated');
	});

	it('get an updated change for different model and different value', function(){
		pathObserver.setModel({user: 'damien'});
		pathObserver.setModel({user: 'clement'});
		expect(firstPart.lastChange.type).toBe('updated');
	});

	it('ignore a change for different model but same value', function(){
		pathObserver.setModel({user: 'damien'});
		var change = firstPart.lastChange;
		pathObserver.setModel({user: 'damien'});
		expect(change).toBe(firstPart.lastChange);
	});

	it('react when the path is resolved', function(){
		pathObserver.setModel({
			user:{
				comment: {
					title: 'titre'
				}
			}		
		});

		expect(lastPart.lastChange.value).toBe('titre');
	});

	it('ignore change out of model', function(){
		pathObserver.setModel({
			user: {
				comment: {
					title: 'titre'
				}
			}		
		});

		var user = firstPart.model.user;
		firstPart.model.user = null;
		user.comment.title = 'coucou';

		expect(lastPart.lastChange.type).toBe('deleted');
		expect(lastPart.lastChange.oldValue).toBe('titre');
	});

});