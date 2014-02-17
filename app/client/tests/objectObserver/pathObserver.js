testModule('objectObserver/pathObserver', function(PathObserver){

	var pathObserver = PathObserver.new('user.comment.title');
	var firstPart = pathObserver.firstPart;
	var lastPart = pathObserver.lastPart;

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