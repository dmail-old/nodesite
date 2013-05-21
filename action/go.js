var redirects = {'/': '/index'};

function calcPath(path){
	var redirect = redirects[path];	
	return redirect || path;
}

module.exports = function(pagePath, callback){	
	pagePath = pagePath.replace(/.html\?.*?$/, '.html');
	
	var path = calcPath(pagePath);
	path = path.substr(1);
	var parts = path.split('/');
	var name = parts.shift();
	
	if( name.endsWith('.html') ){
		this.sendFile(name);
	}
	else{
		name = name.replace(/\.js$/, '');
		var parts = parts;
		
		this.sendScriptResponse(root + '/client/' + name + '.js');
	}	
};