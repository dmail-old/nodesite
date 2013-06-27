/* global Chain, Emitter, Bound, Options */

/*
---

name: Fx

description: Contains the basic animation logic to be extended by all other Fx Itemes.

license: MIT-style license.

requires: [Chain, Events, Options]

provides: Fx

...
*/

NS.Fx = Object.prototype.extend(NS.chain, NS.Emitter, NS.options, {
	options: {
		fps: 60,
		unit: false,
		duration: 500,
		frames: null,
		frameSkip: true,
		link: 'ignore'
	},

	constructor: function(options){
		this.resetChain();
		this.subject = this;
		this.setOptions(options);
	},

	getTransition: function(){
		return function(p){
			return -(Math.cos(Math.PI * p) - 1) / 2;
		};
	},

	step: function(now){
		if (this.options.frameSkip){
			var diff = (this.time != null) ? (now - this.time) : 0, frames = diff / this.frameInterval;
			this.time = now;
			this.frame += frames;
		} else {
			this.frame++;
		}

		if (this.frame < this.frames){
			var delta = this.transition(this.frame / this.frames);
			this.set(this.compute(this.from, this.to, delta));
		} else {
			this.frame = this.frames;
			this.set(this.compute(this.from, this.to, 1));
			this.stop();
		}
	},

	set: function(now){
		return now;
	},

	compute: function(from, to, delta){
		return NS('fx').compute(from, to, delta);
	},

	check: function(){
		if (!this.isRunning()) return true;

		switch (this.options.link){
		case 'cancel':
			this.cancel();
			return true;
		case 'chain':
			this.chain(this.start, this, arguments);
			return false;
		}

		return false;
	},

	start: function(from, to){
		if (!this.check(from, to)) return this;
		this.from = from;
		this.to = to;
		this.frame = (this.options.frameSkip) ? 0 : -1;
		this.time = null;
		this.transition = this.getTransition();
		var frames = this.options.frames, fps = this.options.fps, duration = this.options.duration;
		this.duration = this.self.Durations[duration] || duration.toInt();
		this.frameInterval = 1000 / fps;
		this.frames = frames || Math.round(this.duration / this.frameInterval);
		this.emit('start', this.subject);
		pushInstance.call(this, fps);
		return this;
	},

	stop: function(){
		if (this.isRunning()){
			this.time = null;
			pullInstance.call(this, this.options.fps);
			if (this.frames == this.frame){
				this.emit('complete', this.subject);
				if (!this.callChain()) this.emit('chainComplete', this.subject);
			} else {
				this.emit('stop', this.subject);
			}
		}
		return this;
	},

	cancel: function(){
		if (this.isRunning()){
			this.time = null;
			pullInstance.call(this, this.options.fps);
			this.frame = this.frames;
			this.emit('cancel', this.subject).clearChain();
		}
		return this;
	},

	pause: function(){
		if (this.isRunning()){
			this.time = null;
			pullInstance.call(this, this.options.fps);
		}
		return this;
	},

	resume: function(){
		if ((this.frame < this.frames) && !this.isRunning()) pushInstance.call(this, this.options.fps);
		return this;
	},

	isRunning: function(){
		var list = instances[this.options.fps];
		return list && list.contains(this);
	}
});

NS.Fx.self = {
	compute: function(from, to, delta){
		return (to - from) * delta + from;
	},

	Durations: {
		'short': 250,
		'normal': 500,
		'long': 1000
	}
};

// global timers

var instances = {}, timers = {};

function loop(){
	var now = Date.now();
	for (var i = this.length; i--;){
		var instance = this[i];
		if (instance) instance.step(now);
	}
}

function pushInstance(fps){
	var list = instances[fps] || (instances[fps] = []);
	list.push(this);
	if (!timers[fps]) timers[fps] = setInterval(loop.bind(list), Math.round(1000 / fps));
}

function pullInstance(fps){
	var list = instances[fps];
	if (list){
		list.remove(this);
		if (!list.length && timers[fps]){
			delete instances[fps];
			timers[fps] = clearInterval(timers[fps]);
		}
	}
}

