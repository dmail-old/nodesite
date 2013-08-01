describe('PathObserver set/unset Model', function() {

	var observer = PathObserver.new('user.comment.title');
	var firstPart = observer.firstPart;
	var lastPart = observer.lastPart;
	var model = {
		user: 'damien'
	};
	var sameModel = {
		user: 'damien'
	};
	var differentModel = {
		user: 'cassandre'
	};

	it('should have a change type to new', function(){

		firstPart.setModel(model);
		expect(firstPart.lastChange.type).toBe('new');

	});

	it('should have a change type to deleted', function(){

		firstPart.unsetModel();
		expect(firstPart.lastChange.type).toBe('deleted');

	});

	it('should consider user change to be updated', function(){

		var model = {
			user: 'damien'
		};

		firstPart.setModel(model);
		model.user = 'idir';
		expect(firstPart.lastChange.type).toBe('updated');

	});

	it('should consider an updated change if model are different and value too', function(){

		firstPart.setModel(model);
		firstPart.setModel(differentModel);
		expect(firstPart.lastChange.type).toBe('updated');

	});

	it('should not consider a change if model are different and value the same', function(){

		firstPart.setModel(model);
		var change = firstPart.lastChange;
		firstPart.setModel(sameModel);

		expect(change === firstPart.lastChange).toBe(true);
	});

	it('should not react when the path is resolved', function(){

		firstPart.setModel(model);
		model.user = {
			comment: {
				title: 'titre'
			}
		};
		expect(lastPart.lastChange.type).toBe('new');
		expect(lastPart.lastChange.value).toBe('titre');

	});

	it('should stop recating to model out of the path', function(){

		var user = {
			comment: {
				title: 'titre'
			}
		};

		firstPart.setModel(model);

		model.user = user;
		model.user = null;
		user.comment.title = 'coucou';

		expect(lastPart.lastChange.type).toBe('deleted');
		expect(lastPart.lastChange.oldValue).toBe('titre');

	});

});
