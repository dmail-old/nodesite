var Stream = require('stream');

//example à garder, voici comment faire se succéder des streams
exports['native combination'] = function(test){
	var stream = new Stream.Transform();
	var stream_a = new Stream.Transform();
	var stream_b = new Stream.Transform();

	stream._transform = function(chunk, enc, done){
		done(null, chunk);
	};
	stream_a._transform = function(chunk, enc, done){
		done(null, chunk.toString() + ' stream_a');
	};
	stream_b._transform = function(chunk, enc, done){
		done(null, chunk.toString() + ' stream_b');
	};

	stream.on('data', function(chunk){
		console.log('stream got', chunk.toString());
	});
	stream_a.on('data', function(chunk){
		console.log('stream_a got', chunk.toString());
	});
	/*
	stream_b.on('data', function(chunk){
		console.log('stream_b got', chunk.toString());
	});
	*/

	stream_a.pipe(stream_b);
	stream.pipe(stream_a);
	stream.write('hello');

	test.setTimeout(300);
	test.resolveTo(new Promise(function(resolve, reject){
		stream_b.on('data', function(data){
			resolve(data.toString());
		});
		stream_b.on('error', reject);
	}), 'hello stream_a stream_b');
};

exports['combine streams'] = function(test, ComputedStream){
	var stream = new Stream.Transform();
	var stream_a = new Stream.Transform();
	var stream_b = new Stream.Transform();

	stream._transform = function(chunk, enc, done){
		done(null, chunk);
	};
	stream_a._transform = function(chunk, enc, done){
		done(null, chunk.toString() + ' stream_a');
	};
	stream_b._transform = function(chunk, enc, done){
		done(null, chunk.toString() + ' stream_b');
	};

	stream.on('data', function(chunk){
		console.log('stream got', chunk.toString());
	});
	stream_a.on('data', function(chunk){
		console.log('stream_a got', chunk.toString());
	});
	/*
	stream_b.on('data', function(chunk){
		console.log('stream_b got', chunk.toString());
	});
	*/

	var computedStream = new ComputedStream(stream, stream_a, stream_b);

	stream.write('hello');

	test.setTimeout(300);
	test.resolveTo(new Promise(function(resolve, reject){
		computedStream.on('data', function(data){
			console.log('computed got data', data.toString());
			resolve(data.toString());
		});
		computedStream.on('error', reject);
	}), 'hello stream_a stream_b');
};