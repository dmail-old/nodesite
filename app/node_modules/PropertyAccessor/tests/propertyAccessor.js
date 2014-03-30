testModule('objectPath/objectPath', function(ObjectPath){

	it('has a firstPart with named user', function(){
		var path = ObjectPath.new('user.comment.title');
		expect(path.firstPart.name).toBe('user');
	});

	it('has a firstPart.nextPart named comment', function(){
		var path = ObjectPath.new('user.comment.title');
		expect(path.firstPart.nextPart.name).toBe('comment');
	});

	it('has a lastPart named title', function(){
		var path = ObjectPath.new('user.comment.title');
		expect(path.lastPart.name).toBe('title');
	});

	it('set the correct model to parts', function(){
		var path = ObjectPath.new('user.comment.title');
		var model = {
			user: {
				comment: {
					title: 'titre'
				}
			}
		};
		path.setModel(model);

		expect(path.firstPart.model).toBe(model);
		expect(path.firstPart.nextPart.model).toBe(model.user);
		expect(path.lastPart.model).toBe(model.user.comment);

	});

	it('read the correct value for parts', function(){
		var path = ObjectPath.new('user.comment.title');
		var model = {
			user: {
				comment: {
					title: 'titre'
				}
			}
		};
		path.setModel(model);

		expect(path.firstPart.get()).toBe(model.user);
		expect(path.firstPart.nextPart.get()).toBe(model.user.comment);
		expect(path.lastPart.get()).toBe('titre');
	});

	it('propagate unsetModel', function(){
		var path = ObjectPath.new('user.comment.title');
		var model = {
			user: {
				comment: {
					title: 'titre'
				}
			}
		};
		path.setModel(model);
		path.unsetModel();

		expect(path.firstPart.model).toBe(null);
		expect(path.lastPart.model).toBe(null);

	});

	it('set/get the value', function(){
		var path = ObjectPath.new('user.comment.title');
		var model = {
			user: {
				comment: {
					title: 'titre'
				}
			}
		};
		path.setModel(model);

		path.set('coucou');

		expect(path.get()).toBe('coucou');
		expect(model.user.comment.title).toBe('coucou');

	});

});