exports.extend = {
	startTime: null
};

exports.use = function responseTime(next){
	this.startTime = new Date();
	this.emitter.on('header', function(){
		var time = new Date() - this.startTime;
		this.setHeader('x-response-time', time);
	});
	next();
};
