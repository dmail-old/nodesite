/* global browser */

var exports = {
	options: {
		step: 30,
		wheelStops: true
	},

	attach: function(element){
		this.subject = element;

		if( this.options.wheelStops ){
			var cancel = this.cancel.bind(this);

			this.on({
				start: element.on.bind(element, 'mousewheel', cancel),
				complete: element.off.bind(element, 'mousewheel', cancel),
			});
		}
	},

	add: function(x, y){
		var scroll = this.subject.measure('scroll');
		return this.set([scroll.x + x, scroll.y + y]);
	},

	set: function(now){
		if( browser.firefox ) now = [Math.round(now[0]), Math.round(now[1])]; // not needed anymore in newer firefox versions
		this.subject.scrollTo(now[0], now[1]);
		return this;
	},

	compute: function(from, to, delta){
		return [0, 1].map(function(i){
			return NS.Fx.self.compute(from[i], to[i], delta);
		});
	},

	start: function(x, y){
		if( this.check(x, y) ){
			this.startScroll(this.subject.measure('scroll', 'x'), this.subject.measure('scroll', 'y'), x, y);
		}
		return this;
	},

	startScroll: function(currentX, currentY, x, y){
		return NS.Fx.start.call(this, [currentX, currentY], [x, y]);
	},

	startAdd: function(x, y){
		if( x !== 0 || y !== 0 ){
			var scrollX = this.subject.measure('scroll', 'x'), scrollY = this.subject.measure('scroll', 'y');
			this.startScroll(scrollX, scrollY, scrollX + this.toStep(x), scrollY + this.toStep(y));
		}
		return this;
	},

	toStep: function(value){
		var step = parseInt(this.options.step, 10);

		if( step ){
			if( Math.abs(value) > step ) value = value < 0 ? -step : step;
		}

		return value;
	}
};

exports = NS.Fx.extend(exports);
NS.Fx.Scroll = exports;
