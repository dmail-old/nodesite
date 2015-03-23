var RequireContext = require('RequireContext');
var Path = require('path');
var debug = require('debug');
var dirname = __dirname;

module.exports = {
	cache: require('page-cache').create({
		condition: function(request, response){
			return response.statusCode >= 200 && response.statusCode < 400; // cache only valid response
		},

		createCachedRequest: function(request){
			return {
				url: request.url,
				//body: request.body
			};
		},

		createCachedResponse: function(response){
			return {
				status: response.statusCode,
				body: response.body
			};
		},

		is: function(request, cachedRequest){
			return request.url === cachedRequest.url;
		}
	}),

	'*': function(page, from, path){
		var requireContext;

		from = Path.resolve(dirname, from);
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
					var relativePath = Path.relative(dirname, filename);
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