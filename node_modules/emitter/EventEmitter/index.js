var Emitter = require('Emitter');
var proto = require('@dmail/proto');

var EventEmitter = proto.extend.call(Emitter, {
	handleEvent: function(e){
		this.emit(e.type, e);
	}
});

module.exports = EventEmitter;