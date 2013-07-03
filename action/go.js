var redirects = {
	'/': '/index'
};

function calcPath(path){
	var redirect = redirects[path];
	return redirect || path;
}

module.exports = function(pagePath, callback){
	pagePath = pagePath.replace(/.html\?.*?$/, '.html');

	var path = calcPath(pagePath);
	path = path.substr(1);

	if( path.endsWith('.html') ){
		console.log('sendfile', path);
		this.request.parsedUrl.pathname = path;
		require(root + '/module/responses/file').new(this.request, this.response);
	}
	else{
		path = path.replace(/\.js$/, '');
		this.sendScriptResponse(root + '/client/' + path + '.js');
	}
};
