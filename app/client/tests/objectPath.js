var ObjectPath = require('objectPath/objectPath');
var objectPath = ObjectPath.new('user.comment.title');
var firstPart = objectPath.firstPart;
var lastPart = objectPath.lastPart;

it('has a firstPart with named user', function(){
	expect(firstPart.name).toBe('user');
});

it('has a firstPart.nextPart named comment', function(){
	expect(firstPart.nextPart.name).toBe('comment');
});

it('has a lastPart named title', function(){
	expect(lastPart.name).toBe('title');
});

it('set the correct model to parts', function(){
	
	var model = {
		user: {
			comment: {
				title: 'titre'
			}
		}
	};
	objectPath.setModel(model);

	expect(firstPart.model).toBe(model);
	expect(firstPart.nextPart.model).toBe(model.user);
	expect(lastPart.model).toBe(model.user.comment);

});

it('read the correct value for parts', function(){
	
	var model = {
		user: {
			comment: {
				title: 'titre'
			}
		}
	};
	objectPath.setModel(model);

	expect(firstPart.get()).toBe(model.user);
	expect(firstPart.nextPart.get()).toBe(model.user.comment);
	expect(lastPart.get()).toBe('titre');
});

it('propagate unsetModel', function(){

	var model = {
		user: {
			comment: {
				title: 'titre'
			}
		}
	};
	objectPath.setModel(model);
	firstPart.unsetModel();

	expect(firstPart.model).toBe(null);
	expect(lastPart.model).toBe(null);

});

it('propagate part.set to nextPart model', function(){

	var model = {
		user: {
			comment: {
				title: 'titre'
			}
		}
	};
	objectPath.setModel(model);

	firstPart.set({
		comment: {
			title: 'coucou'
		}
	});

	expect(lastPart.get()).toBe('coucou');

});