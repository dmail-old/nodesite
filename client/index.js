module.exports = function(){
	this.demand.url.pathname = 'html/index.html';
	require(root + '/module/services/file').new(this.demand);
};
