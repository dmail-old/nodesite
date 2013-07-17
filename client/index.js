module.exports = function(){
	this.setHeader('content-type', 'text/html');
	this.send(String(FS.readFileSync('./client/html/index.html')));
};
