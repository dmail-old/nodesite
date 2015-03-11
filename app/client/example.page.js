module.exports = {
	GET: function(page){
		return new Promise(function(resolve, reject){
			page.request.fileSystem.readdir(global.CLIENT_PATH + '/' + page.request.url.pathname, function(error, files){
				if( error ){
					reject(error);
				}
				else{
					resolve({
						body: files
					});
				}
			});
		});
	}
};
