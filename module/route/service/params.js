exports.extend = {
	params: {},
};

exports.use = function paramsProvider(next){
	this.params = Object.append({}, this.urlParams, this.bodyParams);
	next();
};
