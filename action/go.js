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
		this.sendFile(path);
	}
	else{
		path = path.replace(/\.js$/, '');
		this.sendScriptResponse(root + '/client/' + path + '.js');
	}
};
