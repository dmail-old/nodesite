var Path = require('path');

module.exports = {
	'*': function(page, path){
		path = Path.resolve(global.CLIENT_PATH, path);

		/*
		on demande un module, s'il n'est pas dans une blacklist on l'envoit
		en mode debug on enverra 503 pour indiquer que c'est pas autorisé
		en mode normal 404 pour pas que le client sache si le module existe ou pas
		*/
		var blacklisted = false;

		if( blacklisted ){
			return 503; // unauthorized
		}
		else{
			return page.response.createFilePromise(path);
		}
	}
};