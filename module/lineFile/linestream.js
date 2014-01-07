/*
	var LS = require('./db/linestream.js');
	var stream = FS.createReadStream('./error.log');
	var linestream = LS.createLineStream();

	linestream.on('data', function(data){
		console.log('nouvelle ligne:', data.toString());
	});
	stream.pipe(linestream);
*/

module.exports.createLineStream = function(stream){
	if( stream ){
		if( !stream.readable ){
			throw new Error('readStream must be readable');
		}
		if( stream.encoding === null ){
			throw new Error('readStream must have non-null encoding');
		}
		
		var ls = new LineStream();
		stream.pipe(ls);
		return ls;
	}
	else{
		return new LineStream();
	}
};

var
	Stream = require('stream').Stream,
    util = require('util')
;

function LineStream(){
	var
		source,
		buffer = '',
		self = this
	;
	
	this.writable = true;
	this.readable = true;
	
	this.write = function(data, encoding){
		// si on récupère une chaine transforme la en buffer
		if( typeof data == 'string' ){
			data = new Buffer(data, encoding || 'utf8');
		}
		// si on a un buffer en attente du précédent write, on met les buffers ensemble
		if( buffer.length > 0 ){
			data = Buffer.concat(buffer, data);
		}
		
		var pointer = 0, i = 0, j = data.length;
		
		// on parcours tous les charCode du buffer, dès qu'on trouve 10 ('\n'), on envoit un buffer contenant cette ligne
		for(;i<j;i++){
			if( data[i] == 10 ) {
				self.emit('data', data.slice(pointer, i));
				pointer = i+1;
			}
		}
		
		// tout ce qui se trouve après un '\n' mais non suivi d'un '\n' on le met de coté pour le prochain appel à write
		buffer = data.slice(pointer, j);
	};

	this.end = function(){
		// émet la dernière ligne
		self.emit('data', buffer);
		self.emit('end');
	};

	this.on('pipe', function(src){
		source = src;
	});

	this.pause = function(){
		if( !source ){
			throw new Error('pause() only supported when a LineStream is piped into');
		}
		source.pause();
	};

	this.resume = function(){
		if( !source ){
			throw new Error('resume() only supported when a LineStream is piped into');
		}
		source.resume();
	};
}
util.inherits(LineStream, Stream);