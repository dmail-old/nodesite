var References = function(){
	this.objects = [];
	this.values = [];
	this.index = 0;
};

References.prototype = {
	constructor: References,

	has: function(object){
		this.index = this.objects.indexOf(object);
		return this.index != -1;
	},

	add: function(object, value){
		this.objects.push(object);
		this.values.push(value);
	}
};


module.exports = References;