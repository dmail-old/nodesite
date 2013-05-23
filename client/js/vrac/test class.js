var First = new Class({
	Implements: Options,
	options:{
		name: 'first',
		sub: {
			name: 'sub'
		}
	},
	
	initialize: function(options){
		this.setOptions(options);
	}
});

First.prototype.options.before = true;

var Second = new Class({
	Implements: Bound,
	Extends: First,
	options: {
		name: 'second',
		value: 'test'
	},
	
	initialize: function(options){
		this.setOptions(options);
	}
});

First.prototype.options.after = true;

var a = new First(); console.log(a.options, First.prototype.options);
var b = new Second({name: 'b'}); b.options.sub.name = 'coucou'; console.log(b.options, Second.prototype.options);