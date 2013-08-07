var redirects = {

};

function calcPath(path){
	var redirect = redirects[path];
	return redirect || path;
}

module.exports = function(url, callback){
	var pathname;

	url = this.parseUrl(url);
	pathname = calcPath(url.pathname);

	// pour le moment on va considérer que si y'a pas d'extension c un dossier
	var isDirectory = pathname.indexOf('.', pathname.lastIndexOf('/')) === - 1;

	// on demande un dossier
	if( isDirectory ){
		var JSFileExists = FS.existsSync(root + '/client' + pathname + 'index.js');

		if( JSFileExists ){
			this.sendScriptResponse(root + '/client' + pathname + 'index.js');
		}
		else{
			this.sendFile(pathname + 'index.html');
		}
	}
	else if( pathname.endsWith('.html') ){
		console.log('sendfile', pathname);
		this.sendFile(pathname.slice(1));
	}
	else if( pathname.endsWith('.js') ){
		pathname = pathname.replace(/\.js$/, '');
		this.sendScriptResponse(root + '/client' + pathname + '.js');
	}
	else{
		this.send(404);
	}
};
