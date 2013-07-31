describe('PathObserver set/unset Model', function() {

	var observer = PathObserver.new('user.comment.title');
	var firstPart = observer.firstPart;

	it('should have a change type to new', function(){
		firstPart.setModel(Model.new({
			user: 'user'
		}));

		expect(firstPart.lastChange.type).toBe('new');
	});

	it('should have a change type to deleted', function(){
		firstPart.unsetModel();

		expect(firstPart.lastChange.type).toBe('deleted');
	});

	it('should consider user change to be new', function(){
		firstPart.setModel(Model.new({
			user: 'coucou'
		}));

		expect(firstPart.lastChange.type).toBe('new');
	});

	it('should consider user change to be update', function(){
		firstPart.setModel(Model.new({
			user: 'coucou'
		}));
		firstPart.setModel(Model.new({
			user: 'beurk'
		}));

		expect(firstPart.lastChange.type).toBe('updated');
	});

	it('should not consider a change even if model are different', function(){

		firstPart.setModel(Model.new({
			user: 'coucou'
		}));
		var change = firstPart.lastChange;
		firstPart.setModel(Model.new({
			user: 'coucou'
		}));

		expect(change === firstPart.lastChange).toBe(true);
	});

});
