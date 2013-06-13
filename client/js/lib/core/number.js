Number.implement = Object.implement.bind(Number);
Number.complement = Object.complement.bind(Number);

Number.implement({
	limit: function(min, max){
		return Math.min(max, Math.max(min, this));
	},

	toInt: function(base){
		return parseInt(this, base || 10);
	}
});

