var RequireContext = require('RequireContext');
var Path = require('path');
var debug = require('debug');

RequireContext.prototype.rootFolder = global.ROOT_PATH;

module.exports = {
	'*': function(page, from, path){
		var requireContext;

		from = Path.resolve(global.CLIENT_PATH, from);
		requireContext = new RequireContext(from);

		debug('resolving module location', path, 'from', from);

		return requireContext.resolve(path).then(
			function(filename){
				debug('module found at', filename);

				var blacklisted = false;

				if( blacklisted ){
					return 503; // unauthorized
				}
				else{
					var relativePath = Path.relative(global.CLIENT_PATH, filename);
					relativePath = relativePath.replace(/\\/g, '/');
					return relativePath;
				}
			}
		).catch(function(error){
			if( error && error.code === 'MODULE_NOT_FOUND' ){
				debug('module not found');
				return 404;
			}
			debug('error while resolving module', error);
			return Promise.reject(error);
		});
	}
};