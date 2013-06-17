// https://github.com/kanso/path/blob/master/path.js

window.path = {
	normalizeArray: function(parts, keepBlanks){
		var directories = [], prev, i = 0, j = parts.length - 1, directory;
		
		for(;i<=j;i++) {
			directory = parts[i];

			// if it's blank, but it's not the first thing, and not the last thing, skip it.
			if( directory === "" && i !== 0 && i !== j && !keepBlanks ) continue;

			// if it's a dot, and there was some previous dir already, then skip it.
			if( directory === "." && prev !== undefined ) continue;

			// if it starts with "", and is a . or .., then skip it.
			if( directories.length === 1 && directories[0] === "" && (directory === "." || directory === "..") ) continue;

			if( directory === ".." && directories.length && prev !== ".." &&
				prev !== "." && prev !== undefined && (prev !== "" || keepBlanks)
			){
				directories.pop();
				prev = directories.slice(-1)[0];
			}
			else{
				if( prev === "." ) directories.pop();
				directories.push(directory);
				prev = directory;
			}
		}
		
		return directories;
	},
		
	join: function(){
		return this.normalize(Array.prototype.join.call(arguments, '/'));
	},
		
	normalize: function(path, keepBlanks){
		return this.normalizeArray(path.split('/'), keepBlanks).join('/');
	},
		
	dirname: function(path){
		var lastSlash;
		
		if( path.length > 1 && path[path.length - 1] == '/' ) path = path.replace(/\/+$/, '');
		
		lastSlash = path.lastIndexOf('/');
		switch(lastSlash){
		case -1:
			return '.';
		case 0:
			return '/';
		default:
			return path.substring(0, lastSlash);
		}
	},
		
	basename: function(path, ext){
		var basename = path.substr(path.lastIndexOf('/') + 1);
		
		if( typeof ext == 'string' && basename.substr(basename.length - ext.length) === ext ){
			basename = basename.substr(0, basename.length - ext.length);
		}
		
		return basename;
	},
		
	extdot: function(path){
		var dot = path.lastIndexOf('.'), slash = path.lastIndexOf('/');
			
		return dot <= slash + 1 ? -1 : dot;
	},
		
	extname: function(path){
		var dot = this.extdot(path);
			
		return dot > -1 ? path.substring(dot) : '';
	},
		
	filename: function(path){
		return this.basename(path, this.extname(path));
	},

	resolve: function(){
		var resolvedPath = '', resolvedAbsolute = false, i = arguments.length - 1, path;

		while(i >= -1){
			path = i >= 0 ? arguments[i] : './'; //document.location.pathname;

			// Skip empty and invalid entries
			if( typeof path !== 'string' ){
				throw new TypeError('Arguments to path.resolve must be strings');
			}
			else if( !path ) {
				continue;
			}

			resolvedPath = path + '/' + resolvedPath;
			resolvedAbsolute = path.charAt(0) === '/';
			if( resolvedAbsolute ) break;

			i--;
		}

		// At this point the path should be resolved to a full absolute path, but
		// handle relative paths to be safe (might happen when process.cwd() fails)

		// Normalize the path
		resolvedPath = resolvedPath.split('/');
		resolvedPath = resolvedPath.filter(function(p){ return Boolean(p); });
		resolvedPath = this.normalizeArray(resolvedPath, !resolvedAbsolute);
		resolvedPath = resolvedPath.join('/');

		return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
	},

	relative: function(from, to){
		var start, end, i, j, fromParts, toParts, length, samePartsLength, outputParts = [];

		function trim(arr) {
			start = 0;
			for(;start<arr.length;start++){
				if( arr[start] !== '' ) break;
			}
			end = arr.length - 1;
			for (; end >= 0; end--) {
				if (arr[end] !== '') break;
			}

			if( start > end ) return [];
			return arr.slice(start, end - start + 1);
		}

		from = this.normalize(from);
		to = this.normalize(to);
		fromParts = trim(from.split('/'));
		toParts = trim(to.split('/'));
		
		i = 0;
		samePartsLength = j = Math.min(fromParts.length, toParts.length);
		for(;i<j;i++){
			if( fromParts[i] !== toParts[i] ){
				samePartsLength = i;
				break;
			}
		}

		outputParts = [];
		i = samePartsLength;
		j = fromParts.length;
		for(;i<j;i++){
			outputParts.push('..');
		}

		outputParts = outputParts.concat(toParts.slice(samePartsLength));

		return outputParts.join('/');
	}
};