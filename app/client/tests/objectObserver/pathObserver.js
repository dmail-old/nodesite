testModule('objectObserver/pathObserver', function(PathObserver){

	it('react when the path is resolved', function(){
		var pathObserver = PathObserver.new('user.comment.title');

		pathObserver.setModel({
			user:{
				comment: {
					title: 'titre'
				}
			}		
		});

		expect(pathObserver.get()).toBe('titre');
	});

	it('ignore change out of model', function(){
		var pathObserver = PathObserver.new('user.comment.title');

		pathObserver.setModel({
			user: {
				comment: {
					title: 'titre'
				}
			}		
		});

		var user = pathObserver.model.user;
		pathObserver.model.user = null;
		user.comment.title = 'coucou';

		expect(pathObserver.lastChange.type).toBe('deleted');
		expect(pathObserver.lastChange.oldValue).toBe('titre');
	});

	it('got a token for the pathobserver', function(){
		var tokenName = null;
		var pathObserver = PathObserver.new('name', {name: 'damien'}, function(change, token){
			tokenName = token;
		}, null, 'token');

		expect(tokenName).toBe('token');
	});

});