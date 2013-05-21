module.exports = function(){
	this.send({
		html: String(FS.readFileSync('./client/html/index.html'))
	});
};