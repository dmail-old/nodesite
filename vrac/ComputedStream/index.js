/*

Handle multiple DuplexStream from one Duplex stream, the first stream can be Readable only

faut que ça fonctionne même si je lui passe un stream qui n'est que writable
ou que readable, dans ce cas il se demerde pour gérer le passage des données d'un stream à l'autre

si je chain un writable qu'est ce que ça veut dire?

que ce que j'écris dans le writable doit arriver dans la précédent stream non?
donc this.lastStream.pipe(stream) c'est ok.

si ensuite je remet encore un writable qu'est ce que je fais?
ben je pipe le readable dans le writable encore

cependant ce que j'écris dans le writable devrait être readable

dans ce cas là ce que je peux faire c'est euhh

pour un stream que writable pas de solution miracle pour le moment
pour un readable je crée un passtrough qui le rend writable aussi

https://github.com/stream-utils/raw-body/blob/master/index.js
http://bl.ocks.org/nicolashery/5910969

*/

var Stream = require('stream');
var PassThrough = Stream.PassThrough;
var proto = require('@dmail/proto');

function debug(){
	console.log.apply(console, arguments);
}

var StreamCombiner = proto.extend.call(PassThrough, {
	constructor: function(head, middleware, tail){
		StreamCombiner.super.constructor.call(this);

		head.pipe(middleware); // head écrit dans middleware
		middleware.pipe(tail); // middleware écrit dans tail
		tail.pipe(this); // tail écris dans ce stream

		this.head = head; // on écrit dans head
		this.tail = tail; // on lit depuis tail

		this.on('pipe', this.handlePipe.bind(this));
	},

	// when we want to write into this stream
	handlePipe: function(source){
		source.unpipe(this);
		this.head.pipe(source);
	},

	// When we're piped to another stream, instead pipe our internal
	pipe: function(destination, options){
		return this.tail.pipe(destination, options);
	}
});

/*
	addMiddleWare: function(stream){
		if( typeof stream === 'function' ){
			var transform = stream;

			stream = new Stream.Transform();
			stream._transform = transform;
		}
		if( !(stream instanceof Stream) ){
			throw new TypeError('a function or a strema is expected');
		}
		if( !stream.writable || !stream.readable ){
			throw new TypeError('the middleware stream must be readable & writable');
		}

		// maintenant il faut écrire dans ce stream et lire depuis ce stream
	},

	_write: function(chunk, encoding){
		this.stream.write(chunk, encoding);
	},

	_read: function(){
		this.stream.read();
	}
});
*/
module.exports = StreamCombiner;