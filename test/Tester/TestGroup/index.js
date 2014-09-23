/*

Un testgroup par module

*/

var TestGroup = {
	series: null,
	module: null,
	imports: null,
	listener: null,

	init: function(name, series, listener){

	},

	emit: function(){
		this.tester.emit.apply(this.tester, arguments);
	},

	addSerie: function(){

	},

	runSerie: function(){

	},

	nextSerie: function(){

	},

	run: function(){
		this.emit('groupstart', this);
	}
};

module.exports = TestGroup;