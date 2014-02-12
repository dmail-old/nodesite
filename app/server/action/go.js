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
		var JSFileExists = FS.existsSync(global.CLIENT_PATH + pathname + 'index.js');

		if( JSFileExists ){
			this.sendScriptResponse(global.CLIENT_PATH + pathname + 'index.js');
		}
		else{
			this.sendFile(global.CLIENT_PATH + pathname + 'index.html');
		}
	}
	else if( pathname.endsWith('.html') ){
		console.log('sendfile', pathname);
		this.sendFile(global.CLIENT_PATH + pathname);
	}
	else if( pathname.endsWith('.js') ){
		pathname = pathname.replace(/\.js$/, '');
		this.sendScriptResponse(global.CLIENT_PATH + pathname + '.js');
	}
	else{
		this.send(404);
	}
};
