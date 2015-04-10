exports['can add listener without instantiating the emitter'] = function(assert, Emitter){
	// just to show how willBe works but not needed here
	assert.willBe(function(resolve, reject){
		Emitter.prototype.on('test', function(value){
			resolve(value);
		});

		Emitter.prototype.emit('test', 'ok');
	}, 'ok');

	/*
	var value;
	Emitter.prototype.on('test', function(arg){ value = arg; });
	Emitter.prototype.emit('test', 'ok');

	assert.equal(value, 'ok');
	*/
};

exports['call listener'] = function(assert, Emitter){
	var emitter = new Emitter(), value = false;

	emitter.addListener('event', function(arg1){
		value = arg1;
	});
	emitter.callListeners('event', 'yeah');

	assert.equal(value, 'yeah');
};

exports['isListened'] = function(assert, Emitter){
	var emitter = new Emitter(), listener = function(){};

	assert.equal(emitter.isListened('event'), false);
	emitter.addListener('event', listener);
	assert.equal(emitter.isListened('event'), true);
	emitter.removeListener('event', listener);
	assert.equal(emitter.isListened('event'), false);
};

exports['preserve add order when calling listeners'] = function(assert, Emitter){
	var emitter = Emitter.new(), value = null,
	listenera = function(){ value = 'a'; }, listenerb = function(){ value = 'b'; };

	emitter.addListener('event', listenera);
	emitter.addListener('event', listenerb);
	emitter.callListeners('event');

	assert.equal(value, 'b');
};

exports['add volatile listener'] = function(assert, Emitter){
	var emitter = Emitter.new();

	emitter.addVolatileListener('event', function(){});
	emitter.callListeners('event');

	assert.equal(emitter.isListened('event'), false);
};

exports['remove all listeners for specific event'] = function(assert, Emitter){
	var emitter = Emitter.new();

	emitter.addListener('event', function(){});
	emitter.addListener('event', function(){});
	emitter.off('event');

	assert.equal(emitter.isListened('event'), false);
};

exports['remove all listeners'] = function(assert, Emitter){
	var emitter = Emitter.new();

	emitter.addListener('event', function(){});
	emitter.addListener('event', function(){});
	emitter.addListener('event2', function(){});
	emitter.off();

	assert.equal(emitter.isListened('event'), false);
	assert.equal(emitter.isListened('event2'), false);
};

exports['work with multiple events'] = function(assert, Emitter){
	var emitter = Emitter.new(), result = [], listener = function(value){ result.push(value); };

	emitter.on('event event2', listener);

	assert.equal(emitter.isListened('event'), true);
	assert.equal(emitter.isListened('event2'), true);

	emitter.emit('event event2', 'coucou');

	assert.equal(result.join('-'), 'coucou-coucou');

	emitter.off('event event2');

	assert.equal(emitter.isListened('event'), false);
	assert.equal(emitter.isListened('event2'), false);
};

exports['accept object with handleEvent as listener'] = function(assert, Emitter){
	var emitter = Emitter.new(), value, bind, listener = {
		handleEvent: function(arg){
			bind = this;
			value = arg;
		}
	};

	emitter.on('event', listener);
	emitter.emit('event', 'coucou');

	assert.equal(value, 'coucou');
	assert.equal(bind, listener);
};